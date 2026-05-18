/**
 * /results/[scoreId]/page.tsx — Server Component for the Results Dashboard.
 *
 * Responsibilities:
 *   1. Validate scoreId format (UUID)
 *   2. Fetch result data via direct DB query (Server Component — no tRPC client needed)
 *   3. Resolve test metadata from the static data layer
 *   4. Extract interpretation from stored computedScores (server-authoritative)
 *   5. Generate dynamic SEO metadata (noindex — private results)
 *   6. Check auth state (optional) for ClaimCTA rendering
 *   7. Render the <ResultsDashboard> client island with serialisable props
 *
 * Zero client JS is shipped from this layer.
 */

import { notFound } from "next/navigation";
import { eq, countDistinct } from "drizzle-orm";
import type { Metadata } from "next";

import { db } from "@/server/db";
import { results } from "@/server/schema/sessions";
import { users } from "@/server/schema/users";
import { tests, questions } from "@/server/schema/tests";
import type { TestMeta } from "@/lib/data/tests";
import { SEVERITY_COLORS } from "@/lib/types/assessment";
import { getOptionalSession } from "@/lib/auth/dal";
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

  // ── Fetch result from DB (include sessionId for claim flow) ────
  const row = await db
    .select({
      id: results.id,
      sessionId: results.sessionId,
      testId: results.testId,
      totalScore: results.totalScore,
      dimensionScores: results.dimensionScores,
      computedScores: results.computedScores,
      resultLabel: results.resultLabel,
      scoringVersion: results.scoringVersion,
      createdAt: results.createdAt,
      testSlug: tests.slug,
      testTitle: tests.title,
      testAbbreviation: tests.abbreviation,
      testDescription: tests.description,
      testCategory: tests.category,
      testAuthor: tests.author,
      testReleaseYear: tests.releaseYear,
      testThumbnailUrl: tests.thumbnailUrl,
      testColor: tests.color,
    })
    .from(results)
    .innerJoin(tests, eq(results.testId, tests.id))
    .where(eq(results.id, scoreId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    notFound();
  }

  // ── Question count for the "Items" stat on the results card ────
  const [qCountRow] = await db
    .select({ n: countDistinct(questions.id) })
    .from(questions)
    .where(eq(questions.testId, row.testId));
  const questionCount = Number(qCountRow?.n ?? 0);

  // ── Resolve test metadata from the joined tests data ────
  const testMeta: TestMeta = {
    slug: row.testSlug,
    title: row.testTitle,
    abbreviation: row.testAbbreviation,
    description: row.testDescription,
    category: row.testCategory,
    author: row.testAuthor,
    releaseYear: row.testReleaseYear,
    thumbnailUrl: row.testThumbnailUrl,
    color: row.testColor ?? "#9B8EC4",
    questionCount,
  };

  // ── Extract interpretation from computedScores (server-authoritative) ──
  const totalScore = Number(row.totalScore ?? 0);
  const computed = (row.computedScores ?? {}) as Record<string, unknown>;
  const interpData = computed.interpretation as
    | {
        label?: string;
        description?: string;
        recommendation?: string | null;
        severity?: string;
      }
    | null
    | undefined;

  const severity = (interpData?.severity as string) ?? "low";
  const interpretation = {
    label: interpData?.label ?? row.resultLabel ?? "Assessment Complete",
    description: interpData?.description ?? "",
    severity: severity as "low" | "moderate" | "high" | "critical",
    color: SEVERITY_COLORS[severity] ?? "#2ecc71",
  };
  const dimensionScores = (row.dimensionScores ?? {}) as Record<string, number>;

  // Per-dimension max scores — stored in computedScores by the engine since the
  // DSR denominator fix (gpius2-interpretation-scheme branch). Absent for results
  // submitted before this fix; ScoreVisualizer will fall back to inferredMax.
  const dimensionMaxScores =
    (computed.dimensionMaxScores as Record<string, number> | undefined) ?? undefined;

  // Engine writes maxPossibleScore into computedScores at submit time.
  // Falls back to 100 only if the value is missing or zero.
  const rawMax = Number(computed.maxPossibleScore);
  const maxScore = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 100;

  // ── Auth state — determines whether ClaimCTA is shown ────
  const session = await getOptionalSession();
  const isAuthenticated = !!session;

  // ── Resolve logged-in user's email (for pre-filled report request) ────
  let userEmail: string | undefined;
  if (session?.userId) {
    const userRow = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)
      .then((r) => r[0]);
    userEmail = userRow?.email ?? undefined;
  }

  return (
    <ResultsDashboard
      scoreId={row.id}
      sessionId={row.sessionId}
      testMeta={testMeta}
      totalScore={totalScore}
      maxScore={maxScore}
      dimensionScores={dimensionScores}
      dimensionMaxScores={dimensionMaxScores}
      interpretation={interpretation}
      completedAt={row.createdAt.toISOString()}
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
    />
  );
}
