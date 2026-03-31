import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../index";
import { results } from "@/server/schema/sessions";
import { tests } from "@/server/schema/tests";

export const resultsRouter = createTRPCRouter({
  /**
   * getResult — Fetch a completed assessment result by its UUID.
   *
   * Returns the total score, dimension breakdown, test slug, and test
   * metadata needed to render the results dashboard. Intentionally
   * **omits** rawScores (individual answers) since that data is
   * reserved for the admin panel.
   */
  getResult: publicProcedure
    .input(z.object({ scoreId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const row = await ctx.db
        .select({
          id: results.id,
          totalScore: results.totalScore,
          dimensionScores: results.dimensionScores,
          resultLabel: results.resultLabel,
          scoringVersion: results.scoringVersion,
          createdAt: results.createdAt,
          testId: results.testId,
          testSlug: tests.slug,
          testTitle: tests.title,
          testCategory: tests.category,
        })
        .from(results)
        .innerJoin(tests, eq(results.testId, tests.id))
        .where(eq(results.id, input.scoreId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Result not found",
        });
      }

      return {
        id: row.id,
        totalScore: Number(row.totalScore ?? 0),
        dimensionScores: (row.dimensionScores ?? {}) as Record<string, number>,
        resultLabel: row.resultLabel,
        scoringVersion: row.scoringVersion,
        createdAt: row.createdAt.toISOString(),
        testSlug: row.testSlug,
        testTitle: row.testTitle,
        testCategory: row.testCategory,
      };
    }),
});
