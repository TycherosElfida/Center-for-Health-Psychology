/**
 * CHP Platform — Public Tests Procedures
 *
 * Read-only procedures for user-facing pages.
 * No authentication required — returns only published, active tests.
 */
import { z } from "zod";
import { eq, and, countDistinct } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "../index";
import { tests, questions } from "../../schema/tests";

export const publicTestsRouter = createTRPCRouter({
  /**
   * getPublishedTests — Returns all published & active tests for the catalog.
   * Includes question count derived from the questions table.
   */
  getPublishedTests: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        slug: tests.slug,
        title: tests.title,
        description: tests.description,
        abbreviation: tests.abbreviation,
        category: tests.category,
        author: tests.author,
        releaseYear: tests.releaseYear,
        thumbnailUrl: tests.thumbnailUrl,
        color: tests.color,
        questionCount: countDistinct(questions.id),
      })
      .from(tests)
      .leftJoin(questions, eq(questions.testId, tests.id))
      .where(and(eq(tests.status, "published"), eq(tests.isActive, true)))
      .groupBy(tests.id)
      .orderBy(tests.title);

    return rows.map((r) => ({
      ...r,
      color: r.color ?? "#9B8EC4",
      questionCount: Number(r.questionCount),
    }));
  }),

  /**
   * getTestBySlug — Returns a single published test by slug.
   * Used by briefing, test engine, and other server pages.
   */
  getTestBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          slug: tests.slug,
          title: tests.title,
          description: tests.description,
          abbreviation: tests.abbreviation,
          category: tests.category,
          author: tests.author,
          releaseYear: tests.releaseYear,
          thumbnailUrl: tests.thumbnailUrl,
          color: tests.color,
          instructions: tests.instructions,
          questionCount: countDistinct(questions.id),
        })
        .from(tests)
        .leftJoin(questions, eq(questions.testId, tests.id))
        .where(
          and(eq(tests.slug, input.slug), eq(tests.status, "published"), eq(tests.isActive, true))
        )
        .groupBy(tests.id);

      const row = rows[0];
      if (!row) return null;

      return {
        ...row,
        color: row.color ?? "#9B8EC4",
        questionCount: Number(row.questionCount),
      };
    }),
});
