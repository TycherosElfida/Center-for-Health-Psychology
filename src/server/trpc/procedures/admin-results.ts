/**
 * CHP Platform — Admin Test Results Procedures
 *
 * Backend tRPC procedures for the admin Test Results data grid.
 * Admin UI renders at /admin/results (Phase 5).
 *
 * All procedures use `adminProcedure` — requires authenticated admin role.
 *
 * Join path: results → tests (denormalized FK)
 *            results → session_demographics (via results.session_id = sd.session_id)
 *
 * Direct join is valid because results.session_id is a 1:1 FK to test_sessions.id,
 * and session_demographics.session_id is also a 1:1 FK to test_sessions.id.
 * No intermediate hop through test_sessions is needed.
 */
import { eq, and, sql, desc, asc, ilike, gte, lte, type SQL } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, adminProcedure, adminMutationProcedure } from "../index";
import { results, testSessions } from "@/server/schema/sessions";
import { tests } from "@/server/schema/tests";
import { sessionDemographics } from "@/server/schema/session-demographics";
import { auditLogs } from "@/server/schema/admin";

/* ═══════════════════════════════════════════════════════
   Shared Input Schema
   ═══════════════════════════════════════════════════════ */

const filterSchema = z.object({
  testSlug: z.string(),
  search: z.string().optional(),
  sex: z.enum(["Male", "Female"]).optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  ageMin: z.number().int().min(0).optional(),
  ageMax: z.number().int().max(200).optional(),
  scoreMin: z.number().optional(),
  scoreMax: z.number().optional(),
  category: z.string().optional(),
  dateFrom: z.string().optional(), // ISO date
  dateTo: z.string().optional(), // ISO date
});

const listInputSchema = filterSchema.extend({
  sortBy: z
    .enum(["name", "sex", "age", "score", "category", "testDate"])
    .optional()
    .default("testDate"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

/**
 * Builds a dynamic WHERE clause from filters.
 * Returns an array of SQL conditions to be composed with `and()`.
 */
function buildFilterConditions(testId: string, filters: z.infer<typeof filterSchema>): SQL[] {
  const conditions: SQL[] = [eq(results.testId, testId)];

  if (filters.search) {
    conditions.push(ilike(sessionDemographics.name, `%${filters.search}%`));
  }
  if (filters.sex) {
    conditions.push(eq(sessionDemographics.sex, filters.sex));
  }
  if (filters.province) {
    conditions.push(eq(sessionDemographics.province, filters.province));
  }
  if (filters.city) {
    conditions.push(eq(sessionDemographics.city, filters.city));
  }
  if (filters.ageMin !== undefined) {
    conditions.push(gte(sessionDemographics.age, filters.ageMin));
  }
  if (filters.ageMax !== undefined) {
    conditions.push(lte(sessionDemographics.age, filters.ageMax));
  }
  if (filters.scoreMin !== undefined) {
    conditions.push(gte(results.totalScore, filters.scoreMin.toString()));
  }
  if (filters.scoreMax !== undefined) {
    conditions.push(lte(results.totalScore, filters.scoreMax.toString()));
  }
  if (filters.category) {
    conditions.push(eq(results.resultLabel, filters.category));
  }
  if (filters.dateFrom) {
    conditions.push(gte(results.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    // Include the entire "to" day by adding 1 day
    const toDate = new Date(filters.dateTo);
    toDate.setDate(toDate.getDate() + 1);
    conditions.push(lte(results.createdAt, toDate));
  }

  return conditions;
}

/**
 * Maps sortBy field names to actual Drizzle column references.
 */
function getSortColumn(sortBy: string) {
  switch (sortBy) {
    case "name":
      return sessionDemographics.name;
    case "sex":
      return sessionDemographics.sex;
    case "age":
      return sessionDemographics.age;
    case "score":
      return results.totalScore;
    case "category":
      return results.resultLabel;
    case "testDate":
    default:
      return results.createdAt;
  }
}

/* ═══════════════════════════════════════════════════════
   Router
   ═══════════════════════════════════════════════════════ */

export const adminResultsRouter = createTRPCRouter({
  /**
   * Paginated, filtered, sorted list of test results.
   *
   * Two-query pattern:
   *   1. Rows with LIMIT/OFFSET for the current page
   *   2. COUNT(*) with same filters for total pagination count
   */
  list: adminProcedure.input(listInputSchema).query(async ({ input, ctx }) => {
    // Step 1: Resolve testSlug → testId
    const test = await ctx.db
      .select({ id: tests.id })
      .from(tests)
      .where(eq(tests.slug, input.testSlug))
      .limit(1)
      .then((r) => r[0]);

    if (!test) {
      return { rows: [], total: 0 };
    }

    const conditions = buildFilterConditions(test.id, input);
    const whereClause = and(...conditions);

    // Sort direction
    const sortCol = getSortColumn(input.sortBy);
    const orderBy = input.sortDir === "asc" ? asc(sortCol) : desc(sortCol);

    // Query 1: Paginated rows
    const rows = await ctx.db
      .select({
        id: results.id,
        sessionId: results.sessionId,
        name: sessionDemographics.name,
        sex: sessionDemographics.sex,
        age: sessionDemographics.age,
        province: sessionDemographics.province,
        city: sessionDemographics.city,
        totalScore: results.totalScore,
        resultLabel: results.resultLabel,
        createdAt: results.createdAt,
      })
      .from(results)
      .leftJoin(sessionDemographics, eq(results.sessionId, sessionDemographics.sessionId))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(input.limit)
      .offset(input.offset);

    // Query 2: Total count (same filters, no pagination)
    const [countResult] = await ctx.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(results)
      .leftJoin(sessionDemographics, eq(results.sessionId, sessionDemographics.sessionId))
      .where(whereClause);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        name: r.name ?? null,
        sex: r.sex ?? null,
        age: r.age ?? null,
        province: r.province ?? null,
        city: r.city ?? null,
        totalScore: r.totalScore ? Number(r.totalScore) : 0,
        resultLabel: r.resultLabel ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total: countResult?.count ?? 0,
    };
  }),

  /**
   * Aggregate statistics for a test (filtered).
   *
   * All stats reflect the currently filtered dataset,
   * not the full dataset. This enables "filtered analytics".
   */
  stats: adminProcedure.input(filterSchema).query(async ({ input, ctx }) => {
    const test = await ctx.db
      .select({ id: tests.id })
      .from(tests)
      .where(eq(tests.slug, input.testSlug))
      .limit(1)
      .then((r) => r[0]);

    if (!test) {
      return {
        totalRecords: 0,
        maleCount: 0,
        femaleCount: 0,
        avgScore: 0,
        highestScore: 0,
        lowestScore: 0,
        scoreDistribution: [],
        categoryDistribution: [],
        distinctProvinces: [] as string[],
        distinctCities: [] as string[],
      };
    }

    const conditions = buildFilterConditions(test.id, input);
    const whereClause = and(...conditions);

    // Aggregate query — single pass for counts and score stats
    const [agg] = await ctx.db
      .select({
        totalRecords: sql<number>`cast(count(*) as integer)`,
        maleCount: sql<number>`cast(count(*) filter (where ${sessionDemographics.sex} = 'Male') as integer)`,
        femaleCount: sql<number>`cast(count(*) filter (where ${sessionDemographics.sex} = 'Female') as integer)`,
        avgScore: sql<number>`coalesce(round(avg(cast(${results.totalScore} as numeric)), 2), 0)`,
        highestScore: sql<number>`coalesce(max(cast(${results.totalScore} as numeric)), 0)`,
        lowestScore: sql<number>`coalesce(min(cast(${results.totalScore} as numeric)), 0)`,
      })
      .from(results)
      .leftJoin(sessionDemographics, eq(results.sessionId, sessionDemographics.sessionId))
      .where(whereClause);

    // Category distribution — group by resultLabel
    const categoryDist = await ctx.db
      .select({
        category: results.resultLabel,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(results)
      .leftJoin(sessionDemographics, eq(results.sessionId, sessionDemographics.sessionId))
      .where(whereClause)
      .groupBy(results.resultLabel);

    // Score distribution — bucketed into 5 ranges using raw SQL.
    // Uses a subquery to pre-compute max score, avoiding window-in-GROUP-BY issues.
    const scoreDistRows = await ctx.db.execute<{
      bucket: number;
      count: number;
      min_val: number;
      max_val: number;
    }>(sql`
      WITH score_range AS (
        SELECT coalesce(nullif(max(cast(${results.totalScore} as numeric)), 0), 1) + 1 as max_val
        FROM ${results}
        LEFT JOIN ${sessionDemographics} ON ${results.sessionId} = ${sessionDemographics.sessionId}
        WHERE ${whereClause}
      )
      SELECT
        width_bucket(cast(${results.totalScore} as numeric), 0, sr.max_val, 5) as bucket,
        cast(count(*) as integer) as count,
        min(cast(${results.totalScore} as numeric)) as min_val,
        max(cast(${results.totalScore} as numeric)) as max_val
      FROM ${results}
      LEFT JOIN ${sessionDemographics} ON ${results.sessionId} = ${sessionDemographics.sessionId}
      CROSS JOIN score_range sr
      WHERE ${whereClause}
      GROUP BY width_bucket(cast(${results.totalScore} as numeric), 0, sr.max_val, 5)
      ORDER BY bucket
    `);

    // Distinct provinces
    const provincesQuery = await ctx.db
      .select({ value: sessionDemographics.province })
      .from(results)
      .leftJoin(sessionDemographics, eq(results.sessionId, sessionDemographics.sessionId))
      .where(whereClause)
      .groupBy(sessionDemographics.province);

    // Distinct cities
    const citiesQuery = await ctx.db
      .select({ value: sessionDemographics.city })
      .from(results)
      .leftJoin(sessionDemographics, eq(results.sessionId, sessionDemographics.sessionId))
      .where(whereClause)
      .groupBy(sessionDemographics.city);

    return {
      totalRecords: agg?.totalRecords ?? 0,
      maleCount: agg?.maleCount ?? 0,
      femaleCount: agg?.femaleCount ?? 0,
      avgScore: Number(agg?.avgScore ?? 0),
      highestScore: Number(agg?.highestScore ?? 0),
      lowestScore: Number(agg?.lowestScore ?? 0),
      scoreDistribution: (scoreDistRows.rows ?? scoreDistRows).map(
        (b: { min_val: number; max_val: number; count: number }) => ({
          label: `${Math.floor(Number(b.min_val ?? 0))}–${Math.ceil(Number(b.max_val ?? 0))}`,
          count: Number(b.count),
        })
      ),
      categoryDistribution: categoryDist.map((c) => ({
        category: c.category ?? "Uncategorized",
        count: c.count,
      })),
      distinctProvinces: provincesQuery
        .map((p) => p.value)
        .filter((v): v is string => !!v)
        .sort(),
      distinctCities: citiesQuery
        .map((c) => c.value)
        .filter((v): v is string => !!v)
        .sort(),
    };
  }),

  /**
   * Export: unpaginated, filtered results for CSV download.
   *
   * Hard cap of 5000 rows to prevent memory exhaustion.
   * Same filter schema as `list`, no pagination/sort params.
   */
  export: adminProcedure
    .input(
      filterSchema.extend({
        sortBy: z
          .enum(["name", "sex", "age", "score", "category", "testDate"])
          .optional()
          .default("testDate"),
        sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
      })
    )
    .query(async ({ input, ctx }) => {
      const MAX_EXPORT_ROWS = 5000;

      const test = await ctx.db
        .select({ id: tests.id, title: tests.title })
        .from(tests)
        .where(eq(tests.slug, input.testSlug))
        .limit(1)
        .then((r) => r[0]);

      if (!test) {
        return { rows: [], testTitle: "" };
      }

      const conditions = buildFilterConditions(test.id, input);
      const whereClause = and(...conditions);
      const sortCol = getSortColumn(input.sortBy);
      const orderBy = input.sortDir === "asc" ? asc(sortCol) : desc(sortCol);

      const rows = await ctx.db
        .select({
          id: results.id,
          sessionId: results.sessionId,
          name: sessionDemographics.name,
          sex: sessionDemographics.sex,
          age: sessionDemographics.age,
          province: sessionDemographics.province,
          city: sessionDemographics.city,
          totalScore: results.totalScore,
          resultLabel: results.resultLabel,
          createdAt: results.createdAt,
        })
        .from(results)
        .leftJoin(sessionDemographics, eq(results.sessionId, sessionDemographics.sessionId))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(MAX_EXPORT_ROWS);

      return {
        rows: rows.map((r) => ({
          id: r.id,
          sessionId: r.sessionId,
          name: r.name ?? null,
          sex: r.sex ?? null,
          age: r.age ?? null,
          province: r.province ?? null,
          city: r.city ?? null,
          totalScore: r.totalScore ? Number(r.totalScore) : 0,
          resultLabel: r.resultLabel ?? null,
          createdAt: r.createdAt.toISOString(),
        })),
        testTitle: test.title,
      };
    }),

  deleteResult: adminMutationProcedure
    .input(z.object({ scoreId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Step 1: Get sessionId from results table
      const [result] = await ctx.db
        .select({ sessionId: results.sessionId })
        .from(results)
        .where(eq(results.id, input.scoreId))
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Result not found.",
        });
      }

      // Step 2: Delete test_sessions — CASCADE removes results,
      // answers, session_demographics, consents automatically
      await ctx.db.delete(testSessions).where(eq(testSessions.id, result.sessionId));

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "result.deleted",
        entityType: "result",
        entityId: input.scoreId,
      });

      return { success: true };
    }),
});
