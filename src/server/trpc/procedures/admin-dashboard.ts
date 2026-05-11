/**
 * Admin Dashboard — Statistics Procedure
 *
 * Provides aggregate platform metrics for the admin dashboard.
 * All queries use the adminProcedure middleware (JWT validation).
 *
 * Returns:
 *  - totalCompleted, activeSessions, completionRate, pendingReports
 *  - popularTest: most-taken test by completed session count
 *  - recentResults: last 100 results with demographics (name/province/city)
 */
import { sql } from "drizzle-orm";
import { createTRPCRouter, adminProcedure } from "../index";
import { testSessions, results } from "../../schema/sessions";
import { reportRequests } from "../../schema/report-requests";
import { tests } from "../../schema/tests";
import { sessionDemographics } from "../../schema/session-demographics";

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

    // Most popular test by completed session count
    const [popularTestRow] = await ctx.db
      .select({
        title: tests.title,
        sessionCount: sql<number>`count(*)::int`,
      })
      .from(testSessions)
      .innerJoin(tests, sql`${testSessions.testId} = ${tests.id}`)
      .where(sql`${testSessions.status} = 'completed'`)
      .groupBy(tests.id, tests.title)
      .orderBy(sql`count(*) DESC`)
      .limit(1);

    const popularTest = popularTestRow ?? null;

    // Last 100 results with test info and respondent demographics
    const recentResults = await ctx.db
      .select({
        scoreId: results.id,
        sessionId: results.sessionId,
        respondentName: sessionDemographics.name,
        testTitle: tests.title,
        testSlug: tests.slug,
        totalScore: results.totalScore,
        resultLabel: results.resultLabel,
        province: sessionDemographics.province,
        city: sessionDemographics.city,
        createdAt: results.createdAt,
      })
      .from(results)
      .innerJoin(tests, sql`${results.testId} = ${tests.id}`)
      .innerJoin(testSessions, sql`${results.sessionId} = ${testSessions.id}`)
      .leftJoin(sessionDemographics, sql`${sessionDemographics.sessionId} = ${testSessions.id}`)
      .orderBy(sql`${results.createdAt} DESC`)
      .limit(100);

    return {
      totalCompleted,
      activeSessions: activeRow?.count ?? 0,
      completionRate: denominator > 0 ? Math.round((totalCompleted / denominator) * 100) : 0,
      pendingReports: pendingRow?.count ?? 0,
      popularTest,
      recentResults,
    };
  }),
});
