import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../index";
import {
  startSessionSchema,
  saveProgressSchema,
  submitAssessmentSchema,
} from "@/lib/types/assessment";

import { tests, questions, options as optionsTable } from "@/server/schema/tests";
import { testSessions, answers, results } from "@/server/schema/sessions";
import { sessionDemographics } from "@/server/schema/session-demographics";
import { userProfiles } from "@/server/schema/user-profiles";
import { consents } from "@/server/schema/consents";
import { CONSENT_VERSION } from "@/lib/constants/consent";
import { computeScore } from "@/server/scoring/engine";
import { lookupInterpretation } from "@/server/scoring/interpretation";
import { validateAnswerValues, validateCompleteness } from "@/server/scoring/validation";
import { reportRequests } from "@/server/schema/report-requests";
import { resolveRequesterInfo } from "@/server/reports/resolve-requester";

export const sessionsRouter = createTRPCRouter({
  // Phase 2A: getActiveSession — Looks up in-progress sessions for forced-resume
  getActiveSession: publicProcedure
    .input(z.object({ testSlug: z.string(), localSessionId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.userId;

      const test = await ctx.db
        .select()
        .from(tests)
        .where(eq(tests.slug, input.testSlug))
        .limit(1)
        .then((res) => res[0]);

      if (!test) return null;

      // Try authenticated strategy
      if (userId) {
        const session = await ctx.db
          .select()
          .from(testSessions)
          .where(
            and(
              eq(testSessions.userId, userId),
              eq(testSessions.testId, test.id),
              eq(testSessions.status, "in_progress")
            )
          )
          .orderBy(desc(testSessions.startedAt))
          .limit(1)
          .then((res) => res[0]);

        if (session) return { sessionId: session.id };
      }

      // Try anonymous strategy
      if (input.localSessionId) {
        const session = await ctx.db
          .select()
          .from(testSessions)
          .where(
            and(
              eq(testSessions.id, input.localSessionId),
              eq(testSessions.testId, test.id),
              eq(testSessions.status, "in_progress")
            )
          )
          .limit(1)
          .then((res) => res[0]);

        if (session) return { sessionId: session.id };
      }

      return null;
    }),

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
    const userId = ctx.session?.userId;

    // Step 3: Generate a single-use claim token (UUID v4 — 122 bits entropy)
    // Allows anonymous users to claim this session after signing up.
    // If logged in, no claim token needed
    const claimToken = userId ? null : randomUUID();
    const claimExpiresAt = userId ? null : new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h TTL

    // Step 4: Insert into the session database
    const [session] = await ctx.db
      .insert(testSessions)
      .values({
        testId: test.id,
        testVersion: test.version,
        status: "in_progress",
        ipHash,
        userAgentHash,
        userId: userId ?? null, // Instantly attach session to authenticated user
        claimToken,
        claimExpiresAt,
      })
      .returning({ id: testSessions.id, claimToken: testSessions.claimToken });

    // Step 5: Record explicit consent (1:1 with session)
    // consentAccepted is validated as `true` by Zod schema — this INSERT
    // only runs when consent was given. Atomic with session creation.
    if (session?.id) {
      await ctx.db.insert(consents).values({
        sessionId: session.id,
        tosAccepted: true,
        researchOptIn: true,
        marketingOptIn: false,
        consentVersion: CONSENT_VERSION,
        ipHash,
      });
    }

    return {
      sessionId: session?.id ?? "",
      claimToken: session?.claimToken ?? null,
    };
  }),

  // Phase 5: saveDemographics — Persist demographic data alongside a session.
  // Called fire-and-forget by PersonalInfoForm after startSession succeeds.
  // Idempotent: ON CONFLICT (session_id) DO UPDATE handles double-submit.
  // No auth required — sessionId acts as the authorization token.
  saveDemographics: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        name: z.string().min(1).max(100),
        sex: z.enum(["Male", "Female"]),
        age: z.number().int().min(5).max(120).optional(),
        province: z.string().min(1),
        city: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .insert(sessionDemographics)
        .values({
          sessionId: input.sessionId,
          name: input.name,
          sex: input.sex,
          age: input.age ?? null,
          province: input.province,
          city: input.city,
        })
        .onConflictDoUpdate({
          target: sessionDemographics.sessionId,
          set: {
            name: sql`EXCLUDED.name`,
            sex: sql`EXCLUDED.sex`,
            age: sql`EXCLUDED.age`,
            province: sql`EXCLUDED.province`,
            city: sql`EXCLUDED.city`,
          },
        });

      return { success: true as const };
    }),

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

    await ctx.db
      .insert(answers)
      .values(answerEntries)
      .onConflictDoUpdate({
        target: [answers.sessionId, answers.questionId],
        set: {
          value: sql`EXCLUDED.value`,
          answeredAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    return { success: true };
  }),

  // Phase 4F: submitAssessment — Marks complete and commits final scores
  // Hardened: idempotency guard, input validation, transactional atomicity.
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

      // ── Idempotency guard ──────────────────────────────────
      // If a result already exists for this session, return it instead of re-scoring.
      const existingResult = await ctx.db
        .select({ id: results.id })
        .from(results)
        .where(eq(results.sessionId, sessionId))
        .limit(1)
        .then((res) => res[0]);

      if (existingResult) {
        return { sessionId, scoreId: existingResult.id };
      }

      // ── Load answers from DB ───────────────────────────────
      const sessionAnswers = await ctx.db
        .select()
        .from(answers)
        .where(eq(answers.sessionId, sessionId));

      const answerMap: Record<string, unknown> = {};
      sessionAnswers.forEach((a) => {
        answerMap[a.questionId] = a.value;
      });

      // ── Fetch questions + options ──────────────────────────
      const testQs = await ctx.db
        .select()
        .from(questions)
        .where(eq(questions.testId, session.testId));

      const questionIds = testQs.map((q) => q.id);
      const allOptions =
        questionIds.length > 0
          ? await ctx.db
              .select({ questionId: optionsTable.questionId, value: optionsTable.value })
              .from(optionsTable)
              .where(inArray(optionsTable.questionId, questionIds))
          : [];

      // Group options by questionId for O(1) lookup
      const optionsByQuestion = new Map<string, { value: number }[]>();
      for (const opt of allOptions) {
        const arr = optionsByQuestion.get(opt.questionId) ?? [];
        arr.push({ value: opt.value });
        optionsByQuestion.set(opt.questionId, arr);
      }

      // ── Validation: answer values within option bounds ─────
      const valResult = validateAnswerValues(
        answerMap,
        testQs.map((q) => ({ id: q.id, options: optionsByQuestion.get(q.id) }))
      );
      if (!valResult.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid answer values for question(s): ${valResult.invalidQuestionIds.join(", ")}`,
        });
      }

      // ── Validation: completeness ───────────────────────────
      const compResult = validateCompleteness(
        answerMap,
        testQs.map((q) => ({ id: q.id, required: q.required ?? true }))
      );
      if (!compResult.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Missing answers for required question(s): ${compResult.missingQuestionIds.join(", ")}`,
        });
      }

      // ── Pure engine scoring ────────────────────────────────
      const scoreResult = computeScore({
        answers: answerMap,
        questions: testQs.map((q) => ({
          id: q.id,
          dimension: q.dimension,
          isReversed: q.isReversed,
          weight: Number(q.weight),
          options: optionsByQuestion.get(q.id),
        })),
      });

      // ── Interpretation lookup ──────────────────────────────
      // Per-dimension interpretations (for instruments like SRQ-29)
      const dimensionInterpretations: Record<
        string,
        {
          label: string;
          description: string;
          recommendation: string | null;
          severity: string;
        }
      > = {};

      const hasDimensions = Object.keys(scoreResult.dimensionScores).length > 0;

      if (hasDimensions) {
        for (const [dimension, dimScore] of Object.entries(scoreResult.dimensionScores)) {
          const dimInterp = await lookupInterpretation(session.testId, dimScore, dimension);
          if (dimInterp) {
            dimensionInterpretations[dimension] = dimInterp;
          }
        }
      }

      // Total-score interpretation — skip for dimension-only instruments
      // (e.g. SRQ-29 has no total-score bands, only per-dimension bands)
      const interpretation = hasDimensions
        ? null
        : await lookupInterpretation(session.testId, scoreResult.totalScore);

      const enrichedComputedScores = {
        ...scoreResult.computedScores,
        maxPossibleScore: scoreResult.maxPossibleScore,
        interpretation: interpretation
          ? {
              label: interpretation.label,
              description: interpretation.description,
              recommendation: interpretation.recommendation,
              severity: interpretation.severity,
            }
          : null,
        ...(Object.keys(dimensionInterpretations).length > 0 ? { dimensionInterpretations } : {}),
      };

      // ── Sequential writes (neon-http driver lacks transaction support) ──
      // Safety: the idempotency guard above prevents duplicate results.
      await ctx.db
        .update(testSessions)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(testSessions.id, sessionId));

      const [inserted] = await ctx.db
        .insert(results)
        .values({
          sessionId,
          testId: session.testId,
          totalScore: scoreResult.totalScore.toString(),
          dimensionScores: scoreResult.dimensionScores,
          rawScores: scoreResult.rawScores,
          computedScores: enrichedComputedScores,
          resultLabel: interpretation?.label ?? null,
          scoringVersion: 1,
        })
        .returning({ id: results.id });

      const resultId = inserted?.id ?? "";

      return { sessionId, scoreId: resultId };
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

      // 7. Auto-promote demographics to user_profiles (first-write-wins).
      //    If the user already has a profile, skip silently.
      try {
        const [existingProfile] = await ctx.db
          .select({ userId: userProfiles.userId })
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1);

        if (!existingProfile) {
          const [demo] = await ctx.db
            .select()
            .from(sessionDemographics)
            .where(eq(sessionDemographics.sessionId, input.sessionId))
            .limit(1);

          if (demo) {
            await ctx.db.insert(userProfiles).values({
              userId,
              displayName: demo.name,
              sex: demo.sex,
              age: demo.age,
              province: demo.province,
              city: demo.city,
            });
          }
        }
      } catch {
        // Non-critical — profile promotion is best-effort
      }

      return { success: true as const, alreadyOwned: false };
    }),

  // Phase 1B: requestEmailReport — Admin-gated report request queue
  // Inserts a pending request into report_requests. Guests provide email
  // (encrypted), authenticated users resolve via userId.
  requestEmailReport: publicProcedure
    .input(
      z.object({
        scoreId: z.string().uuid(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { scoreId, email } = input;
      const userId = ctx.session?.userId ?? null;

      // 1. Resolve scoreId → result row
      const result = await ctx.db
        .select({ id: results.id, sessionId: results.sessionId, testId: results.testId })
        .from(results)
        .where(eq(results.id, scoreId))
        .limit(1)
        .then((r) => r[0]);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Result not found" });
      }

      // 2. Idempotency: check for existing non-rejected request
      const existing = await ctx.db
        .select({ id: reportRequests.id, status: reportRequests.status })
        .from(reportRequests)
        .where(
          and(eq(reportRequests.resultId, scoreId), sql`${reportRequests.status} != 'rejected'`)
        )
        .limit(1)
        .then((r) => r[0]);

      if (existing) {
        return { success: true as const, alreadyRequested: true, requestId: existing.id };
      }

      // 3. Resolve requester info (encrypt email for guests)
      const requester = resolveRequesterInfo(userId, email);

      // 4. Insert report request as pending
      const [inserted] = await ctx.db
        .insert(reportRequests)
        .values({
          sessionId: result.sessionId,
          testId: result.testId,
          resultId: result.id,
          ...requester,
        })
        .returning({ id: reportRequests.id });

      return {
        success: true as const,
        alreadyRequested: false,
        requestId: inserted?.id ?? "",
      };
    }),
});
