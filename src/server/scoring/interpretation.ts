import { eq, and, or, isNull, lte, gte } from "drizzle-orm";
import { db } from "@/server/db";
import { resultInterpretations, tests } from "@/server/schema/tests";
import * as Sentry from "@sentry/nextjs";
import { getScoreInterpretation } from "@/lib/scoring/interpretation";

export async function lookupInterpretation(
  testId: string,
  totalScore: number,
  dimension?: string
): Promise<{
  label: string;
  description: string;
  recommendation: string | null;
  severity: string;
  source: "database" | "hardcoded";
} | null> {
  const scoreStr = totalScore.toString();

  // Build dimension filter based on whether dimension is specified
  const dimensionFilter = dimension
    ? eq(resultInterpretations.dimension, dimension)
    : or(isNull(resultInterpretations.dimension), eq(resultInterpretations.dimension, "total"));

  const [row] = await db
    .select()
    .from(resultInterpretations)
    .where(
      and(
        eq(resultInterpretations.testId, testId),
        dimensionFilter,
        // Postgres handles string -> numeric casting correctly when parameter is string
        lte(resultInterpretations.minScore, scoreStr),
        gte(resultInterpretations.maxScore, scoreStr)
      )
    )
    .limit(1);

  // 2. If a row is found → return it with source: "database"
  if (row) {
    return {
      label: row.label,
      description: row.description,
      recommendation: row.recommendation,
      severity: row.severity,
      source: "database",
    };
  }

  // 3. If no row → fire Sentry breadcrumb
  Sentry.addBreadcrumb({
    category: "scoring",
    message: `DB interpretation miss: testId=${testId}, score=${totalScore}. Using hardcoded fallback.`,
    level: "warning",
  });

  // Query tests table to find the slug for the hardcoded fallback
  const [testRow] = await db
    .select({ slug: tests.slug })
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1);

  const testSlug = testRow?.slug ?? "unknown";

  // Call existing hardcoded logic
  const fallback = getScoreInterpretation(testSlug, totalScore);

  // 4. If hardcoded also returns null → return null
  if (!fallback) {
    return null;
  }

  return {
    label: fallback.label,
    description: fallback.description,
    recommendation: null,
    severity: fallback.severity,
    source: "hardcoded",
  };
}
