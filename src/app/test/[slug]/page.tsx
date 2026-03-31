/**
 * /test/[slug]/page.tsx — Server Component entry point for the assessment engine.
 *
 * Responsibilities:
 *   1. Validate slug → notFound() on miss
 *   2. Load test metadata + questions from static data layers
 *   3. Generate dynamic SEO metadata
 *   4. Create a server-side session via tRPC caller
 *   5. Render the <AssessmentForm> client island with serialisable props
 *
 * Zero client JS is shipped from this layer — all interactivity is
 * encapsulated in AssessmentForm.
 */

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { getTestMeta } from "@/lib/data/tests";
import { getQuestions } from "@/lib/data/questions";
import { AssessmentForm } from "@/components/test/AssessmentForm";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface TestPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sessionId?: string }>;
}

/* ═══════════════════════════════════════════════════════
   Dynamic Metadata
   ═══════════════════════════════════════════════════════ */

export async function generateMetadata({ params }: TestPageProps): Promise<Metadata> {
  const { slug } = await params;
  const test = getTestMeta(slug);

  if (!test) {
    return { title: "Test Not Found — CHP" };
  }

  return {
    title: `${test.shortName} Assessment — CHP`,
    description: test.description,
    robots: { index: false, follow: false },
  };
}

/* ═══════════════════════════════════════════════════════
   Page Component (RSC)
   ═══════════════════════════════════════════════════════ */

export default async function TestPage({ params, searchParams }: TestPageProps) {
  const { slug } = await params;
  const { sessionId } = await searchParams;

  // ── Validate slug ───────────────────────────────────────
  const testMeta = getTestMeta(slug);
  const questions = getQuestions(slug);

  if (!testMeta || !questions || questions.length === 0) {
    notFound();
  }

  // ── Session UUID Validation ─────────────────────────────
  const isValidUUID = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!sessionId || !isValidUUID(sessionId)) {
    redirect(`/test/${slug}/briefing`);
  }

  return <AssessmentForm testMeta={testMeta} questions={questions} sessionId={sessionId} />;
}
