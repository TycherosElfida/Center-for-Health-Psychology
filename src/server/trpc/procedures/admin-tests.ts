/**
 * CHP Platform — Admin Test Management Procedures (1D.7)
 *
 * CRUD lifecycle for assessment instruments with the following guards:
 * - Publish gate: question_count >= 1
 * - Delete guard: status === 'draft' AND session_count === 0
 * - Structural lock: slug + scoringMethod immutable when session_count > 0
 * - Status transitions: draft→published, published→archived, archived→draft
 *
 * All mutations produce audit log entries. Counts use countDistinct()
 * to avoid Cartesian product inflation from double LEFT JOINs.
 */
import { z } from "zod";
import { eq, countDistinct, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure, adminMutationProcedure } from "../index";
import { tests, questions } from "../../schema/tests";
import { testSessions } from "../../schema/sessions";
import { auditLogs } from "../../schema/admin";
import { getSessionCount } from "./_shared";

// ── Input Schemas ────────────────────────────────────────────────────

export const createTestSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(1000).optional().default(""),
  category: z.string().min(1).max(100),
  abbreviation: z.string().min(2).max(20),
  releaseYear: z.number().int().max(new Date().getFullYear()).nullable().optional(),
  author: z.string().min(1).max(200).nullable().optional(),
  scoringMethod: z.enum(["summative", "dimensional", "binary_cluster"]),
  instructions: z.string().max(5000).optional().default(""),
  thumbnailUrl: z.string().max(500).or(z.literal("")).optional().default(""),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .default("#9B8EC4"),
});

export const updateTestSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100).optional(),
  abbreviation: z.string().min(2).max(20).optional(),
  releaseYear: z.number().int().max(new Date().getFullYear()).nullable().optional(),
  author: z.string().min(1).max(200).nullable().optional(),
  scoringMethod: z.enum(["summative", "dimensional", "binary_cluster"]).optional(),
  instructions: z.string().max(5000).optional(),
  thumbnailUrl: z.string().max(500).or(z.literal("")).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
});

export const getCategoriesSchema = z.object({});

// ── Router ───────────────────────────────────────────────────────────

export const adminTestsRouter = createTRPCRouter({
  /**
   * getTests — Admin list view with session + question counts.
   * Uses countDistinct to prevent Cartesian product inflation.
   */
  getTests: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: tests.id,
        slug: tests.slug,
        title: tests.title,
        description: tests.description,
        category: tests.category,
        abbreviation: tests.abbreviation,
        releaseYear: tests.releaseYear,
        author: tests.author,
        status: tests.status,
        scoringMethod: tests.scoringMethod,
        instructions: tests.instructions,
        thumbnailUrl: tests.thumbnailUrl,
        color: tests.color,
        isActive: tests.isActive,
        version: tests.version,
        createdAt: tests.createdAt,
        updatedAt: tests.updatedAt,
        sessionCount: countDistinct(testSessions.id),
        questionCount: countDistinct(questions.id),
      })
      .from(tests)
      .leftJoin(testSessions, eq(testSessions.testId, tests.id))
      .leftJoin(questions, eq(questions.testId, tests.id))
      .groupBy(tests.id)
      .orderBy(tests.createdAt);

    // Serialize createdAt/updatedAt at the server→client boundary
    return rows.map((r) => ({
      ...r,
      sessionCount: Number(r.sessionCount),
      questionCount: Number(r.questionCount),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }),

  /**
   * getTestById — Full test data for the [id] edit page.
   */
  getTestById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: tests.id,
          slug: tests.slug,
          title: tests.title,
          description: tests.description,
          category: tests.category,
          abbreviation: tests.abbreviation,
          releaseYear: tests.releaseYear,
          author: tests.author,
          status: tests.status,
          scoringMethod: tests.scoringMethod,
          instructions: tests.instructions,
          thumbnailUrl: tests.thumbnailUrl,
          color: tests.color,
          isActive: tests.isActive,
          version: tests.version,
          createdAt: tests.createdAt,
          updatedAt: tests.updatedAt,
          sessionCount: countDistinct(testSessions.id),
          questionCount: countDistinct(questions.id),
        })
        .from(tests)
        .leftJoin(testSessions, eq(testSessions.testId, tests.id))
        .leftJoin(questions, eq(questions.testId, tests.id))
        .where(eq(tests.id, input.id))
        .groupBy(tests.id);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
      }

      return {
        ...row,
        sessionCount: Number(row.sessionCount),
        questionCount: Number(row.questionCount),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),

  /**
   * getCategories — Returns distinct categories used across all tests.
   */
  getCategories: adminProcedure.input(getCategoriesSchema).query(async ({ ctx }) => {
    const rows = await ctx.db
      .selectDistinct({ category: tests.category })
      .from(tests)
      .where(sql`${tests.category} != ''`);

    return rows.map((r) => r.category);
  }),

  /**
   * createTest — Create a new draft assessment.
   * Validates slug uniqueness before insert.
   */
  createTest: adminMutationProcedure.input(createTestSchema).mutation(async ({ ctx, input }) => {
    // Slug uniqueness check
    const [existing] = await ctx.db
      .select({ id: tests.id })
      .from(tests)
      .where(eq(tests.slug, input.slug))
      .limit(1);

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Slug "${input.slug}" is already in use.`,
      });
    }

    const [created] = await ctx.db
      .insert(tests)
      .values({
        title: input.title,
        slug: input.slug,
        description: input.description || null,
        category: input.category,
        abbreviation: input.abbreviation,
        releaseYear: input.releaseYear || null,
        author: input.author || null,
        scoringMethod: input.scoringMethod,
        instructions: input.instructions || null,
        thumbnailUrl: input.thumbnailUrl || null,
        color: input.color || "#9B8EC4",
        status: "draft",
        isActive: true,
        version: 1,
      })
      .returning({ id: tests.id, slug: tests.slug });

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create test.",
      });
    }

    // Audit log
    await ctx.db.insert(auditLogs).values({
      adminUserId: ctx.adminSession.id,
      action: "test.created",
      entityType: "test",
      entityId: created.id,
      oldValue: null,
      newValue: { title: input.title, slug: input.slug, scoringMethod: input.scoringMethod },
    });

    return created;
  }),

  /**
   * updateTest — Edit test fields with structural lock enforcement.
   *
   * Guards:
   * - Status cannot be changed via generic update (use publish/archive)
   * - slug and scoringMethod are locked if session_count > 0
   * - slug uniqueness checked (excluding self)
   */
  updateTest: adminMutationProcedure.input(updateTestSchema).mutation(async ({ ctx, input }) => {
    // Fetch current state
    const [current] = await ctx.db.select().from(tests).where(eq(tests.id, input.id)).limit(1);

    if (!current) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
    }

    // Structural lock: slug and scoringMethod immutable when sessions exist
    const sessionCount = await getSessionCount(ctx.db, input.id);

    if (sessionCount > 0) {
      if (input.slug !== undefined && input.slug !== current.slug) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Slug cannot be changed after sessions have been recorded.",
        });
      }
      if (input.scoringMethod !== undefined && input.scoringMethod !== current.scoringMethod) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Scoring method cannot be changed after sessions have been recorded.",
        });
      }
    }

    // Slug uniqueness check (exclude self)
    if (input.slug !== undefined && input.slug !== current.slug) {
      const [collision] = await ctx.db
        .select({ id: tests.id })
        .from(tests)
        .where(and(eq(tests.slug, input.slug), sql`${tests.id} != ${input.id}`))
        .limit(1);

      if (collision) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Slug "${input.slug}" is already in use.`,
        });
      }
    }

    // Build update payload — only include fields that were provided
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.description !== undefined) updatePayload.description = input.description || null;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.abbreviation !== undefined) updatePayload.abbreviation = input.abbreviation;
    if (input.releaseYear !== undefined) updatePayload.releaseYear = input.releaseYear;
    if (input.author !== undefined) updatePayload.author = input.author;
    if (input.scoringMethod !== undefined) updatePayload.scoringMethod = input.scoringMethod;
    if (input.instructions !== undefined) updatePayload.instructions = input.instructions || null;
    if (input.thumbnailUrl !== undefined) updatePayload.thumbnailUrl = input.thumbnailUrl || null;
    if (input.color !== undefined) updatePayload.color = input.color;

    const [updated] = await ctx.db
      .update(tests)
      .set(updatePayload)
      .where(eq(tests.id, input.id))
      .returning({ id: tests.id });

    // Audit log — capture diff
    const oldValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};
    for (const key of Object.keys(updatePayload)) {
      if (key === "updatedAt") continue;
      oldValue[key] = (current as Record<string, unknown>)[key];
      newValue[key] = updatePayload[key];
    }

    await ctx.db.insert(auditLogs).values({
      adminUserId: ctx.adminSession.id,
      action: "test.updated",
      entityType: "test",
      entityId: input.id,
      oldValue,
      newValue,
    });

    return updated;
  }),

  /**
   * publishTest — Transition draft → published.
   *
   * Preconditions:
   * 1. Current status must be 'draft' or 'archived'
   * 2. question_count >= 1
   */
  publishTest: adminMutationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select({
          id: tests.id,
          status: tests.status,
          title: tests.title,
        })
        .from(tests)
        .where(eq(tests.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
      }

      if (current.status === "published") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Test is already published.",
        });
      }

      // Gate: question_count >= 1
      const [qCount] = await ctx.db
        .select({ count: countDistinct(questions.id) })
        .from(questions)
        .where(eq(questions.testId, input.id));

      if (Number(qCount?.count ?? 0) < 1) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot publish a test with no questions.",
        });
      }

      await ctx.db
        .update(tests)
        .set({
          status: "published",
          updatedAt: new Date(),
        })
        .where(eq(tests.id, input.id));

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "test.published",
        entityType: "test",
        entityId: input.id,
        oldValue: { status: current.status },
        newValue: { status: "published" },
      });

      return { id: input.id, status: "published" as const };
    }),

  /**
   * archiveTest — Transition published → archived.
   */
  archiveTest: adminMutationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select({ id: tests.id, status: tests.status })
        .from(tests)
        .where(eq(tests.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
      }

      if (current.status !== "published") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Only published tests can be archived.",
        });
      }

      await ctx.db
        .update(tests)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(tests.id, input.id));

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "test.archived",
        entityType: "test",
        entityId: input.id,
        oldValue: { status: "published" },
        newValue: { status: "archived" },
      });

      return { id: input.id, status: "archived" as const };
    }),

  /**
   * revertToDraft — Transition archived → draft.
   * Allows re-editing and re-publishing of archived tests.
   */
  revertToDraft: adminMutationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select({ id: tests.id, status: tests.status })
        .from(tests)
        .where(eq(tests.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
      }

      if (current.status !== "archived") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Only archived tests can be reverted to draft.",
        });
      }

      await ctx.db
        .update(tests)
        .set({
          status: "draft",
          updatedAt: new Date(),
        })
        .where(eq(tests.id, input.id));

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "test.reverted_to_draft",
        entityType: "test",
        entityId: input.id,
        oldValue: { status: "archived" },
        newValue: { status: "draft" },
      });

      return { id: input.id, status: "draft" as const };
    }),

  /**
   * deleteTest — Hard delete a draft test with zero sessions.
   *
   * Guards (both must pass):
   * 1. test.status === 'draft'
   * 2. session_count === 0
   *
   * CASCADE FKs handle child deletion (questions → options).
   * Uses a transaction with snapshot for atomicity.
   */
  deleteTest: adminMutationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Snapshot: lock the row and fetch state
        const [current] = await tx
          .select({
            id: tests.id,
            title: tests.title,
            slug: tests.slug,
            status: tests.status,
          })
          .from(tests)
          .where(eq(tests.id, input.id))
          .limit(1);

        if (!current) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
        }

        // Guard 1: draft only
        if (current.status !== "draft") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Only draft tests can be deleted. Archive this test instead.",
          });
        }

        // Guard 2: zero sessions
        const sessionCount = await getSessionCount(tx, input.id);
        if (sessionCount > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Cannot delete a test with ${sessionCount} session(s). Archive it instead.`,
          });
        }

        // CASCADE handles questions → options deletion
        await tx.delete(tests).where(eq(tests.id, input.id));

        // Audit log (outside transaction scope for the audit table)
        await tx.insert(auditLogs).values({
          adminUserId: ctx.adminSession.id,
          action: "test.deleted",
          entityType: "test",
          entityId: input.id,
          oldValue: { title: current.title, slug: current.slug },
          newValue: null,
        });

        return { id: input.id, deleted: true };
      });
    }),
});
