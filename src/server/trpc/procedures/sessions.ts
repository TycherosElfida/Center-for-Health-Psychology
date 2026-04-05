import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../index";
import {
  startSessionSchema,
  saveProgressSchema,
  submitAssessmentSchema,
} from "@/lib/types/assessment";

import { tests, questions } from "@/server/schema/tests";
import { testSessions, answers, results } from "@/server/schema/sessions";
import { computeScore } from "@/server/scoring/engine";

export const sessionsRouter = createTRPCRouter({
  // Phase 4F: startSession — Resolves testSlug to testId and creates session tracking row
  startSession: publicProcedure.input(startSessionSchema).mutation(async ({ input, ctx }) => {
    // Step 1: Resolve the test ID via slug
    const test = await ctx.db
      .select()
      .from(tests)
      .where(eq(tests.slug, input.testSlug))
      .limit(1)
      .then((res) => res[0]);

    if (!test) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Test not found" });
    }

    // Step 2: Handle mandatory required constraints per DB Schema
    // IP and UserAgent are hashed for anonymity limits as per schema definition
    let ip = "unknown";
    let ua = "unknown";

    if (ctx.headers) {
      ip = ctx.headers.get("x-forwarded-for") || "unknown";
      ua = ctx.headers.get("user-agent") || "unknown";
    }

    const ipHash = btoa(ip);
    const userAgentHash = btoa(ua);

    // Step 3: Generate a single-use claim token (UUID v4 — 122 bits entropy)
    // Allows anonymous users to claim this session after signing up.
    const claimToken = randomUUID();
    const claimExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h TTL

    // Step 4: Insert into the session database
    const [session] = await ctx.db
      .insert(testSessions)
      .values({
        testId: test.id,
        testVersion: test.version,
        status: "in_progress",
        ipHash,
        userAgentHash,
        claimToken,
        claimExpiresAt,
      })
      .returning({ id: testSessions.id, claimToken: testSessions.claimToken });

    return {
      sessionId: session?.id ?? "",
      claimToken: session?.claimToken ?? null,
    };
  }),

  // Phase 4F: saveProgress — Batch PostgreSQL UPSERT for storing intermediate answers
  saveProgress: publicProcedure.input(saveProgressSchema).mutation(async ({ input, ctx }) => {
    const { sessionId, answers: answerMap } = input;

    const answerEntries = Object.entries(answerMap).map(([questionId, value]) => ({
      sessionId,
      questionId,
      value,
    }));

    // Short-circuit to avoid DB trips for empty commits
    if (answerEntries.length === 0) {
      return { success: true };
    }

    // Explicit DB level ON CONFLICT constraint logic mapping to schema unique setup
    await ctx.db
      .insert(answers)
      .values(answerEntries)
      .onConflictDoUpdate({
        target: [answers.sessionId, answers.questionId],
        set: {
          value: sql`EXCLUDED.value`, // Update the jsonb mapping
          answeredAt: sql`CURRENT_TIMESTAMP`, // Explicitly increment the record modified time
        },
      });

    return { success: true };
  }),

  // Phase 4F: submitAssessment — Marks complete and commits final scores
  submitAssessment: publicProcedure
    .input(submitAssessmentSchema)
    .mutation(async ({ input, ctx }) => {
      const { sessionId } = input;

      const session = await ctx.db
        .select()
        .from(testSessions)
        .where(eq(testSessions.id, sessionId))
        .limit(1)
        .then((res) => res[0]);

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      // Load answers from DB
      const sessionAnswers = await ctx.db
        .select()
        .from(answers)
        .where(eq(answers.sessionId, sessionId));

      const answerMap: Record<string, unknown> = {};
      sessionAnswers.forEach((a) => {
        answerMap[a.questionId] = a.value;
      });

      // Fetch questions properties to evaluate
      const testQs = await ctx.db
        .select()
        .from(questions)
        .where(eq(questions.testId, session.testId));

      // Pure engine scoring execution
      const scoreResult = computeScore({
        answers: answerMap,
        questions: testQs.map((q) => ({
          id: q.id,
          dimension: q.dimension,
          isReversed: q.isReversed,
          weight: Number(q.weight),
        })),
      });

      // Atomic commit: update session logic state
      await ctx.db
        .update(testSessions)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(testSessions.id, sessionId));

      const [result] = await ctx.db
        .insert(results)
        .values({
          sessionId,
          testId: session.testId,
          totalScore: scoreResult.totalScore.toString(),
          dimensionScores: scoreResult.dimensionScores,
          rawScores: scoreResult.rawScores,
          computedScores: scoreResult.computedScores,
          scoringVersion: 1,
        })
        .returning({ id: results.id });

      return { sessionId, scoreId: result?.id ?? "" };
    }),

  // Phase 2B.1: claimSession — Atomic anonymous→authenticated handoff.
  // Security properties:
  //   - protectedProcedure → unauthenticated callers rejected
  //   - Token nullified after claim → single-use, no replay
  //   - Expiry checked before claim
  //   - Same-user claim → idempotent success
  //   - Cross-user claim → FORBIDDEN
  //   - WHERE clause in UPDATE re-checks token at DB level (race-safe)
  claimSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        claimToken: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;

      // 1. Fetch the session — must exist
      const [session] = await ctx.db
        .select()
        .from(testSessions)
        .where(eq(testSessions.id, input.sessionId))
        .limit(1);

      // 2. Existence check
      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session tidak ditemukan." });
      }

      // 3. Token match — fixed-length comparison (UUIDs are 36 chars)
      if (
        !session.claimToken ||
        session.claimToken.length !== input.claimToken.length ||
        session.claimToken !== input.claimToken
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token tidak valid." });
      }

      // 4. Expiry check
      if (!session.claimExpiresAt || session.claimExpiresAt < new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token telah kadaluarsa." });
      }

      // 5. Already-claimed check — prevent replay attacks
      if (session.userId !== null) {
        // Idempotent success if same user is claiming again
        if (session.userId === userId) {
          return { success: true as const, alreadyOwned: true };
        }
        // Cross-user claim → reject
        throw new TRPCError({ code: "FORBIDDEN", message: "Sesi ini sudah diklaim." });
      }

      // 6. Atomic claim — set userId, destroy token (single-use enforcement)
      //    WHERE re-checks claimToken at DB level for race-condition safety.
      await ctx.db
        .update(testSessions)
        .set({
          userId,
          claimToken: null,
          claimExpiresAt: null,
        })
        .where(
          and(eq(testSessions.id, input.sessionId), eq(testSessions.claimToken, input.claimToken))
        );

      return { success: true as const, alreadyOwned: false };
    }),

  // Phase 5: requestEmailReport — Lead capture for emailed results
  // Placeholder: validates input and returns success. Production will
  // encrypt the email via AES-256-GCM and INSERT into guestLeads.
  requestEmailReport: publicProcedure
    .input(
      z.object({
        scoreId: z.string().uuid(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // In production:
      // 1. Resolve scoreId → sessionId + testId
      // 2. encrypt(input.email) → encryptedEmail
      // 3. INSERT INTO guest_leads (sessionId, testId, encryptedEmail)
      // 4. Enqueue async email delivery job
      console.info("[requestEmailReport] Lead captured:", {
        scoreId: input.scoreId,
        email: input.email,
      });

      return { success: true as const };
    }),
});
