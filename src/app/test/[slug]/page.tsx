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

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getTestMeta } from "@/lib/data/tests";
import { getQuestions } from "@/lib/data/questions";
import { AssessmentForm } from "@/components/test/AssessmentForm";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface TestPageProps {
  params: Promise<{ slug: string }>;
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

export default async function TestPage({ params }: TestPageProps) {
  const { slug } = await params;

  // ── Validate slug ───────────────────────────────────────
  const testMeta = getTestMeta(slug);
  const questions = getQuestions(slug);

  if (!testMeta || !questions || questions.length === 0) {
    notFound();
  }

  // ── Session ID ──────────────────────────────────────────
  // For the client-side engine, we generate a deterministic session key
  // based on the test slug. The actual DB session is created when the
  // client calls `startSession` via tRPC. This approach avoids making
  // the page.tsx dependent on DB queries at render time.
  //
  // The AssessmentForm will call trpc.sessions.startSession on mount
  // to get a real UUID session from the server. Until then, the
  // localStorage key uses this slug-based identifier.
  const clientSessionKey = `assessment_${slug}`;

  return <AssessmentForm testMeta={testMeta} questions={questions} sessionId={clientSessionKey} />;
}
