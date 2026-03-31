/**
 * /results/[scoreId]/page.tsx — Server Component for the Results Dashboard.
 *
 * Responsibilities:
 *   1. Validate scoreId format (UUID)
 *   2. Fetch result data via direct DB query (Server Component — no tRPC client needed)
 *   3. Resolve test metadata from the static data layer
 *   4. Compute score interpretation
 *   5. Generate dynamic SEO metadata (noindex — private results)
 *   6. Render the <ResultsDashboard> client island with serialisable props
 *
 * Zero client JS is shipped from this layer.
 */

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

import { db } from "@/server/db";
import { results } from "@/server/schema/sessions";
import { tests } from "@/server/schema/tests";
import { getTestMeta } from "@/lib/data/tests";
import { getScoreInterpretation } from "@/lib/scoring/interpretation";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface ResultsPageProps {
  params: Promise<{ scoreId: string }>;
}

/* ═══════════════════════════════════════════════════════
   UUID validation (no Zod import needed at RSC boundary)
   ═══════════════════════════════════════════════════════ */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ═══════════════════════════════════════════════════════
   Dynamic Metadata
   ═══════════════════════════════════════════════════════ */

export async function generateMetadata({ params }: ResultsPageProps): Promise<Metadata> {
  const { scoreId } = await params;

  if (!UUID_RE.test(scoreId)) {
    return { title: "Invalid Result — CHP" };
  }

  return {
    title: "Assessment Results — CHP",
    description: "View your completed assessment results and score breakdown.",
    robots: { index: false, follow: false },
  };
}

/* ═══════════════════════════════════════════════════════
   Page Component (RSC)
   ═══════════════════════════════════════════════════════ */

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { scoreId } = await params;

  // ── Validate UUID format ────────────────────────────────
  if (!UUID_RE.test(scoreId)) {
    notFound();
  }

  // ── Fetch result from DB ────────────────────────────────
  const row = await db
    .select({
      id: results.id,
      totalScore: results.totalScore,
      dimensionScores: results.dimensionScores,
      resultLabel: results.resultLabel,
      scoringVersion: results.scoringVersion,
      createdAt: results.createdAt,
      testSlug: tests.slug,
    })
    .from(results)
    .innerJoin(tests, eq(results.testId, tests.id))
    .where(eq(results.id, scoreId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    notFound();
  }

  // ── Resolve static test metadata ────────────────────────
  const testMeta = getTestMeta(row.testSlug);
  if (!testMeta) {
    notFound();
  }

  // ── Compute interpretation ──────────────────────────────
  const totalScore = Number(row.totalScore ?? 0);
  const maxScore = testMeta.maxScore ?? 100;
  const interpretation = getScoreInterpretation(testMeta.id, totalScore, maxScore);
  const dimensionScores = (row.dimensionScores ?? {}) as Record<string, number>;

  return (
    <ResultsDashboard
      scoreId={row.id}
      testMeta={testMeta}
      totalScore={totalScore}
      dimensionScores={dimensionScores}
      interpretation={interpretation}
      completedAt={row.createdAt.toISOString()}
    />
  );
}
