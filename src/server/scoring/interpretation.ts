import { eq, and, or, isNull, lte, gte } from "drizzle-orm";
import { db } from "@/server/db";
import { resultInterpretations } from "@/server/schema/tests";
import * as Sentry from "@sentry/nextjs";

/**
 * Authoritative interpretation lookup — queries the result_interpretations table.
 *
 * Returns null (not a fallback) if no matching band exists. The caller
 * decides how to handle a miss. Sentry captures all misses for monitoring.
 */
export async function lookupInterpretation(
  testId: string,
  totalScore: number,
  dimension?: string
): Promise<{
  label: string;
  description: string;
  recommendation: string | null;
  severity: string;
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

  if (row) {
    return {
      label: row.label,
      description: row.description,
      recommendation: row.recommendation,
      severity: row.severity,
    };
  }

  // No DB match → fire Sentry warning for monitoring
  Sentry.captureMessage(
    `Interpretation miss: testId=${testId}, score=${totalScore}, dimension=${dimension ?? "total"}`,
    { level: "warning" }
  );

  return null;
}
