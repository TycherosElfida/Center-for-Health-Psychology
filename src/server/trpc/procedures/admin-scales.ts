/**
 * CHP Platform — Admin Scale Management Procedures (1D.11)
 *
 * CRUD for result_interpretations with validated-instrument lock guard.
 * Locked slugs: pss10, gpius2, srs, srq29 — hardcoded constant.
 *
 * Lock policy: These instruments have canonical scoring references
 * (Cohen 1983, Caplan 2010, Schwarzer 1999, WHO SRQ). Any future
 * additions require a code change — not an admin toggle.
 */
import { z } from "zod";
import { eq, asc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure, adminMutationProcedure } from "../index";
import { tests, resultInterpretations } from "../../schema/tests";
import { auditLogs } from "../../schema/admin";

// ── Constants ────────────────────────────────────────────────────────

/**
 * Validated instrument slugs whose interpretation ranges are locked.
 * These instruments have canonical scoring references that must not be
 * altered through the admin UI. This is a hardcoded policy constant,
 * NOT a database flag — any future additions require a code change.
 */
const VALIDATED_INSTRUMENT_SLUGS = ["pss10", "gpius2", "srs", "srq29"] as const;

// ── Input Schemas ────────────────────────────────────────────────────

export const getScaleConfigSchema = z.object({
  testId: z.string().uuid(),
});

export const updateRangeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(200).optional(),
  minScore: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  maxScore: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  description: z.string().min(1).max(2000).optional(),
  recommendation: z.string().max(2000).nullable().optional(),
  severity: z.enum(["low", "moderate", "high", "critical"]).optional(),
});

export const addRangeSchema = z.object({
  testId: z.string().uuid(),
  dimension: z.string().nullable(),
  label: z.string().min(1).max(200),
  minScore: z.string().regex(/^\d+(\.\d{1,2})?$/),
  maxScore: z.string().regex(/^\d+(\.\d{1,2})?$/),
  description: z.string().min(1).max(2000),
  recommendation: z.string().max(2000).nullable().optional(),
  severity: z.enum(["low", "moderate", "high", "critical"]),
});

export const deleteRangeSchema = z.object({
  id: z.string().uuid(),
});

// ── Helpers ──────────────────────────────────────────────────────────

function assertNotLocked(slug: string): void {
  if ((VALIDATED_INSTRUMENT_SLUGS as readonly string[]).includes(slug)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Cannot modify ranges of a validated instrument.",
    });
  }
}

// ── Router ───────────────────────────────────────────────────────────

export const adminScalesRouter = createTRPCRouter({
  /**
   * getScaleConfig — Fetch grouped interpretation ranges for a test.
   * Groups by dimension, returns isLocked flag based on slug.
   */
  getScaleConfig: adminProcedure.input(getScaleConfigSchema).query(async ({ ctx, input }) => {
    // Fetch test slug
    const [test] = await ctx.db
      .select({ slug: tests.slug })
      .from(tests)
      .where(eq(tests.id, input.testId));

    if (!test) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
    }

    const isLocked = (VALIDATED_INSTRUMENT_SLUGS as readonly string[]).includes(test.slug);

    // Fetch all interpretation rows, ordered by dimension then minScore
    const rows = await ctx.db
      .select()
      .from(resultInterpretations)
      .where(eq(resultInterpretations.testId, input.testId))
      .orderBy(
        asc(sql`${resultInterpretations.dimension} NULLS FIRST`),
        asc(resultInterpretations.minScore)
      );

    // Group by dimension
    const dimMap = new Map<string, (typeof rows)[number][]>();
    for (const row of rows) {
      const key = row.dimension ?? "__overall__";
      if (!dimMap.has(key)) dimMap.set(key, []);
      dimMap.get(key)!.push(row);
    }

    const dimensions = Array.from(dimMap.entries()).map(([name, ranges]) => ({
      name,
      displayName:
        name === "__overall__" ? "Overall Score" : name.charAt(0).toUpperCase() + name.slice(1),
      ranges: ranges.map((r) => ({
        id: r.id,
        minScore: r.minScore,
        maxScore: r.maxScore,
        label: r.label,
        description: r.description,
        recommendation: r.recommendation,
        severity: r.severity,
      })),
    }));

    return { testSlug: test.slug, isLocked, dimensions };
  }),

  /**
   * updateRange — Partial update of a single interpretation range.
   * Blocked for validated instruments.
   */
  updateRange: adminMutationProcedure.input(updateRangeSchema).mutation(async ({ ctx, input }) => {
    // Resolve parent test slug via JOIN
    const [row] = await ctx.db
      .select({ slug: tests.slug, testId: resultInterpretations.testId })
      .from(resultInterpretations)
      .innerJoin(tests, eq(tests.id, resultInterpretations.testId))
      .where(eq(resultInterpretations.id, input.id));

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Range not found." });
    }

    assertNotLocked(row.slug);

    // Build partial update payload
    const { id, ...fields } = input;
    const updatePayload: Record<string, unknown> = {};
    if (fields.label !== undefined) updatePayload.label = fields.label;
    if (fields.minScore !== undefined) updatePayload.minScore = fields.minScore;
    if (fields.maxScore !== undefined) updatePayload.maxScore = fields.maxScore;
    if (fields.description !== undefined) updatePayload.description = fields.description;
    if (fields.recommendation !== undefined) updatePayload.recommendation = fields.recommendation;
    if (fields.severity !== undefined) updatePayload.severity = fields.severity;

    if (Object.keys(updatePayload).length > 0) {
      await ctx.db
        .update(resultInterpretations)
        .set(updatePayload)
        .where(eq(resultInterpretations.id, id));
    }

    // Audit log
    await ctx.db.insert(auditLogs).values({
      adminUserId: ctx.adminSession.id,
      action: "scale_range.updated",
      entityType: "result_interpretation",
      entityId: id,
      newValue: updatePayload,
    });

    return { id };
  }),

  /**
   * addRange — Insert a new interpretation range for a test.
   * Blocked for validated instruments.
   */
  addRange: adminMutationProcedure.input(addRangeSchema).mutation(async ({ ctx, input }) => {
    // Fetch test slug
    const [test] = await ctx.db
      .select({ slug: tests.slug })
      .from(tests)
      .where(eq(tests.id, input.testId));

    if (!test) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Test not found." });
    }

    assertNotLocked(test.slug);

    const [created] = await ctx.db
      .insert(resultInterpretations)
      .values({
        testId: input.testId,
        dimension: input.dimension,
        minScore: input.minScore,
        maxScore: input.maxScore,
        label: input.label,
        description: input.description,
        recommendation: input.recommendation ?? null,
        severity: input.severity,
        version: 1,
      })
      .returning({ id: resultInterpretations.id });

    if (!created) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Insert failed." });
    }

    // Audit log
    await ctx.db.insert(auditLogs).values({
      adminUserId: ctx.adminSession.id,
      action: "scale_range.created",
      entityType: "result_interpretation",
      entityId: created.id,
      newValue: { testId: input.testId, dimension: input.dimension, label: input.label },
    });

    return { id: created.id };
  }),

  /**
   * deleteRange — Remove an interpretation range.
   * Blocked for validated instruments.
   */
  deleteRange: adminMutationProcedure.input(deleteRangeSchema).mutation(async ({ ctx, input }) => {
    // Resolve parent test slug via JOIN
    const [row] = await ctx.db
      .select({
        slug: tests.slug,
        label: resultInterpretations.label,
        dimension: resultInterpretations.dimension,
      })
      .from(resultInterpretations)
      .innerJoin(tests, eq(tests.id, resultInterpretations.testId))
      .where(eq(resultInterpretations.id, input.id));

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Range not found." });
    }

    assertNotLocked(row.slug);

    await ctx.db.delete(resultInterpretations).where(eq(resultInterpretations.id, input.id));

    // Audit log — capture what was deleted
    await ctx.db.insert(auditLogs).values({
      adminUserId: ctx.adminSession.id,
      action: "scale_range.deleted",
      entityType: "result_interpretation",
      entityId: input.id,
      oldValue: { label: row.label, dimension: row.dimension },
    });

    return { id: input.id, deleted: true as const };
  }),
});
