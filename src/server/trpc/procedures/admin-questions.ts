/**
 * CHP Platform — Admin Question Management Procedures (1D.8)
 *
 * CRUD lifecycle for assessment questions with structural lock enforcement:
 * - getQuestions: list questions + options for a test (read-only)
 * - createQuestion: insert question + options (blocked when locked)
 * - updateQuestion: partial update with lock-aware field filtering
 * - deleteQuestion: remove question (blocked when locked)
 * - reorderQuestions: batch order update (blocked when locked)
 *
 * Structural lock policy: when sessionCount > 0, only cosmetic changes
 * (questionText, option labels) are permitted. Scoring-affecting fields
 * (dimension, isReversed, weight, option values, add/remove) are frozen.
 */
import { z } from "zod";
import { eq, and, sql, max } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure, adminMutationProcedure } from "../index";
import { tests, questions, options } from "../../schema/tests";
import { auditLogs } from "../../schema/admin";
import { getSessionCount } from "./_shared";

// ── Input Schemas (exported for test consumption) ────────────────────

const questionTypeEnum = z.enum([
  "likert_5",
  "likert_7",
  "multiple_choice",
  "slider",
  "multi_select",
]);

export const createQuestionSchema = z.object({
  testId: z.string().uuid(),
  questionText: z.string().min(1).max(2000),
  type: questionTypeEnum,
  dimension: z.string().max(100).nullable().optional(),
  isReversed: z.boolean().default(false),
  weight: z.string().default("1.00"),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(500),
        value: z.number().int(),
      })
    )
    .min(2),
});

export const updateQuestionSchema = z.object({
  id: z.string().uuid(),
  questionText: z.string().min(1).max(2000).optional(),
  dimension: z.string().max(100).nullable().optional(),
  isReversed: z.boolean().optional(),
  weight: z.string().optional(),
  options: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        label: z.string().min(1).max(500),
        value: z.number().int(),
      })
    )
    .optional(),
});

export const deleteQuestionSchema = z.object({
  id: z.string().uuid(),
});

export const reorderQuestionsSchema = z.object({
  testId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
});

export const getQuestionsSchema = z.object({
  testId: z.string().uuid(),
});

// ── Router ───────────────────────────────────────────────────────────

export const adminQuestionsRouter = createTRPCRouter({
  /**
   * getQuestions — List all questions for a test with their options.
   * Returns sessionCount for frontend lock-state derivation.
   */
  getQuestions: adminProcedure.input(getQuestionsSchema).query(async ({ ctx, input }) => {
    // Verify test exists
    const [test] = await ctx.db
      .select({ id: tests.id, title: tests.title, status: tests.status, category: tests.category })
      .from(tests)
      .where(eq(tests.id, input.testId))
      .limit(1);

    if (!test) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
    }

    const sessionCount = await getSessionCount(ctx.db, input.testId);

    // Fetch questions ordered by `order`
    const questionRows = await ctx.db
      .select()
      .from(questions)
      .where(eq(questions.testId, input.testId))
      .orderBy(questions.order);

    // Fetch all options for these questions
    const questionIds = questionRows.map((q) => q.id);
    let optionRows: (typeof options.$inferSelect)[] = [];
    if (questionIds.length > 0) {
      optionRows = await ctx.db
        .select()
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(
            questionIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
        .orderBy(options.order);
    }

    // Group options by questionId
    const optionsByQuestion = new Map<string, (typeof options.$inferSelect)[]>();
    for (const opt of optionRows) {
      const existing = optionsByQuestion.get(opt.questionId) ?? [];
      existing.push(opt);
      optionsByQuestion.set(opt.questionId, existing);
    }

    return {
      test,
      sessionCount,
      questions: questionRows.map((q) => ({
        ...q,
        options: optionsByQuestion.get(q.id) ?? [],
      })),
    };
  }),

  /**
   * createQuestion — Insert a new question with its options.
   * Auto-assigns order = max(existing order) + 1.
   * Blocked when sessionCount > 0 (structural lock).
   */
  createQuestion: adminMutationProcedure
    .input(createQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify test exists
      const [test] = await ctx.db
        .select({ id: tests.id })
        .from(tests)
        .where(eq(tests.id, input.testId))
        .limit(1);

      if (!test) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
      }

      // Structural lock guard
      const sessionCount = await getSessionCount(ctx.db, input.testId);
      if (sessionCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot add questions: this assessment has ${sessionCount} session(s).`,
        });
      }

      // Auto-assign order
      const [maxRow] = await ctx.db
        .select({ maxOrder: max(questions.order) })
        .from(questions)
        .where(eq(questions.testId, input.testId));
      const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

      // Insert question
      const [inserted] = await ctx.db
        .insert(questions)
        .values({
          testId: input.testId,
          questionText: input.questionText,
          type: input.type,
          dimension: input.dimension ?? null,
          isReversed: input.isReversed,
          weight: input.weight,
          order: nextOrder,
          required: true,
        })
        .returning({ id: questions.id });

      if (!inserted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create question.",
        });
      }

      // Insert options
      const optionValues = input.options.map((opt, i) => ({
        questionId: inserted.id,
        order: i + 1,
        label: opt.label,
        value: opt.value,
      }));
      await ctx.db.insert(options).values(optionValues);

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "question.created",
        entityType: "question",
        entityId: inserted.id,
        newValue: { testId: input.testId, questionText: input.questionText },
      });

      return { id: inserted.id };
    }),

  /**
   * updateQuestion — Partial update with lock-aware field filtering.
   *
   * When locked (sessionCount > 0):
   * - questionText: ALLOWED (cosmetic)
   * - dimension: BLOCKED when the value changes (scoring-affecting — it
   *   alters dimensionScores/cluster flags on re-score); resending the
   *   unchanged value is allowed because the editor always includes it
   * - isReversed: BLOCKED (scoring-affecting)
   * - weight: BLOCKED (scoring-affecting)
   * - options: only label changes allowed; value/count changes blocked
   */
  updateQuestion: adminMutationProcedure
    .input(updateQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      // Fetch existing question
      const [existing] = await ctx.db
        .select()
        .from(questions)
        .where(eq(questions.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Question not found." });
      }

      const sessionCount = await getSessionCount(ctx.db, existing.testId);
      const isLocked = sessionCount > 0;

      // Lock guard: reject structural changes when locked
      if (isLocked) {
        if (input.isReversed !== undefined) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Cannot change isReversed: assessment has active sessions.",
          });
        }
        if (input.weight !== undefined) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Cannot change weight: assessment has active sessions.",
          });
        }
        if (input.dimension !== undefined && input.dimension !== existing.dimension) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Cannot change dimension: assessment has active sessions.",
          });
        }
      }

      // Build update object (only provided fields)
      const updates: Record<string, unknown> = {};
      if (input.questionText !== undefined) updates.questionText = input.questionText;
      if (input.dimension !== undefined) updates.dimension = input.dimension;
      if (!isLocked && input.isReversed !== undefined) updates.isReversed = input.isReversed;
      if (!isLocked && input.weight !== undefined) updates.weight = input.weight;

      // Apply question updates if any
      if (Object.keys(updates).length > 0) {
        await ctx.db.update(questions).set(updates).where(eq(questions.id, input.id));
      }

      // Handle options update (full-replace strategy)
      if (input.options !== undefined) {
        const existingOptions = await ctx.db
          .select()
          .from(options)
          .where(eq(options.questionId, input.id))
          .orderBy(options.order);

        if (isLocked) {
          // When locked: only label changes allowed
          // Reject if option count changes
          if (input.options.length !== existingOptions.length) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Cannot add/remove options: assessment has active sessions.",
            });
          }
          // Reject if any option value changes
          for (const opt of input.options) {
            if (opt.id) {
              const existingOpt = existingOptions.find((e) => e.id === opt.id);
              if (existingOpt && existingOpt.value !== opt.value) {
                throw new TRPCError({
                  code: "PRECONDITION_FAILED",
                  message: "Cannot change option values: assessment has active sessions.",
                });
              }
            }
          }
          // Only update labels
          for (const opt of input.options) {
            if (opt.id) {
              await ctx.db.update(options).set({ label: opt.label }).where(eq(options.id, opt.id));
            }
          }
        } else {
          // When unlocked: full-replace strategy
          // Delete all existing options, then re-insert
          await ctx.db.delete(options).where(eq(options.questionId, input.id));

          const optionValues = input.options.map((opt, i) => ({
            questionId: input.id,
            order: i + 1,
            label: opt.label,
            value: opt.value,
          }));
          if (optionValues.length > 0) {
            await ctx.db.insert(options).values(optionValues);
          }
        }
      }

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "question.updated",
        entityType: "question",
        entityId: input.id,
        newValue: { updatedFields: Object.keys(updates) },
      });

      return { id: input.id };
    }),

  /**
   * deleteQuestion — Remove a question (CASCADE handles options).
   * Blocked when sessionCount > 0 (structural lock).
   */
  deleteQuestion: adminMutationProcedure
    .input(deleteQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      // Fetch existing question to get testId
      const [existing] = await ctx.db
        .select({
          id: questions.id,
          testId: questions.testId,
          questionText: questions.questionText,
        })
        .from(questions)
        .where(eq(questions.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Question not found." });
      }

      // Structural lock guard
      const sessionCount = await getSessionCount(ctx.db, existing.testId);
      if (sessionCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete question: assessment has ${sessionCount} session(s).`,
        });
      }

      // CASCADE handles options deletion
      await ctx.db.delete(questions).where(eq(questions.id, input.id));

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "question.deleted",
        entityType: "question",
        entityId: input.id,
        oldValue: { testId: existing.testId, questionText: existing.questionText },
        newValue: null,
      });

      return { id: input.id, deleted: true };
    }),

  /**
   * reorderQuestions — Batch-update order column for all questions in a test.
   * Validates orderedIds matches the exact set of question IDs.
   * Blocked when sessionCount > 0 (structural lock).
   */
  reorderQuestions: adminMutationProcedure
    .input(reorderQuestionsSchema)
    .mutation(async ({ ctx, input }) => {
      // Structural lock guard
      const sessionCount = await getSessionCount(ctx.db, input.testId);
      if (sessionCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot reorder questions: assessment has ${sessionCount} session(s).`,
        });
      }

      // Fetch existing question IDs for this test
      const existingQuestions = await ctx.db
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.testId, input.testId));

      const existingIds = new Set(existingQuestions.map((q) => q.id));
      const inputIds = new Set(input.orderedIds);

      // Validate: orderedIds must be exact match
      if (existingIds.size !== inputIds.size) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "orderedIds must contain exactly all question IDs for this test.",
        });
      }
      for (const id of input.orderedIds) {
        if (!existingIds.has(id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Question ID ${id} does not belong to this test.`,
          });
        }
      }

      // Batch update order
      for (let i = 0; i < input.orderedIds.length; i++) {
        const qId = input.orderedIds[i]!;
        await ctx.db
          .update(questions)
          .set({ order: i + 1 })
          .where(and(eq(questions.id, qId), eq(questions.testId, input.testId)));
      }

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "question.reordered",
        entityType: "test",
        entityId: input.testId,
        newValue: { orderedIds: input.orderedIds },
      });

      return { success: true };
    }),
});
