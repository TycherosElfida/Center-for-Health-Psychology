/**
 * Admin Dashboard — Statistics Procedure
 *
 * Provides aggregate platform metrics for the admin dashboard.
 * All queries use the adminProcedure middleware (JWT validation).
 */
import { sql } from "drizzle-orm";
import { createTRPCRouter, adminProcedure } from "../index";
import { testSessions, results } from "../../schema/sessions";
import { reportRequests } from "../../schema/report-requests";
import { tests } from "../../schema/tests";

export const adminDashboardRouter = createTRPCRouter({
  stats: adminProcedure.query(async ({ ctx }) => {
    // Parallel count queries for efficiency
    const [completedRow] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(testSessions)
      .where(sql`${testSessions.status} = 'completed'`);

    const [activeRow] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(testSessions)
      .where(sql`${testSessions.status} = 'in_progress'`);

    const [abandonedRow] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(testSessions)
      .where(sql`${testSessions.status} = 'abandoned'`);

    const [pendingRow] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(reportRequests)
      .where(sql`${reportRequests.status} = 'pending'`);

    const totalCompleted = completedRow?.count ?? 0;
    const totalAbandoned = abandonedRow?.count ?? 0;
    const denominator = totalCompleted + totalAbandoned;

    // Recent 10 completed results with test name
    const recentResults = await ctx.db
      .select({
        id: results.id,
        totalScore: results.totalScore,
        resultLabel: results.resultLabel,
        createdAt: results.createdAt,
        testTitle: tests.title,
        testSlug: tests.slug,
      })
      .from(results)
      .innerJoin(tests, sql`${results.testId} = ${tests.id}`)
      .orderBy(sql`${results.createdAt} DESC`)
      .limit(10);

    return {
      totalCompleted,
      activeSessions: activeRow?.count ?? 0,
      completionRate: denominator > 0 ? Math.round((totalCompleted / denominator) * 100) : 0,
      pendingReports: pendingRow?.count ?? 0,
      recentResults,
    };
  }),
});
