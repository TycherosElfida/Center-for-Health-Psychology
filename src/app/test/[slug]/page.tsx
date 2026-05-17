/**
 * /test/[slug]/page.tsx — Server Component entry point for the assessment engine.
 *
 * Responsibilities:
 *   1. Validate slug → notFound() on miss
 *   2. Load test metadata + questions from the DATABASE (Drizzle relational query)
 *   3. Generate dynamic SEO metadata
 *   4. Map DB rows to the AssessmentForm Question[] contract
 *   5. Render the <AssessmentForm> client island with serialisable props
 *
 * Zero client JS is shipped from this layer — all interactivity is
 * encapsulated in AssessmentForm.
 */

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { AssessmentForm } from "@/components/test/AssessmentForm";
import { db } from "@/server/db";
import { tests } from "@/server/schema/tests";
import { answers } from "@/server/schema/sessions";
import { eq, and } from "drizzle-orm";
import type { TestMeta } from "@/lib/data/tests";
import type { Question, AnswerOption } from "@/lib/data/questions";

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
  const [row] = await db
    .select({
      title: tests.title,
      abbreviation: tests.abbreviation,
      description: tests.description,
    })
    .from(tests)
    .where(and(eq(tests.slug, slug), eq(tests.status, "published")))
    .limit(1);

  if (!row) {
    return { title: "Test Not Found — CHP" };
  }

  return {
    title: `${row.abbreviation} Assessment — CHP`,
    description: row.description ?? undefined,
    robots: { index: false, follow: false },
  };
}

/* ═══════════════════════════════════════════════════════
   Page Component (RSC)
   ═══════════════════════════════════════════════════════ */

export default async function TestPage({ params, searchParams }: TestPageProps) {
  const { slug } = await params;
  const { sessionId } = await searchParams;

  // ── Fetch test + questions + options in a single relational query ──
  const testWithQuestions = await db.query.tests.findFirst({
    where: {
      slug,
      status: "published",
      isActive: true,
    },
    columns: {
      slug: true,
      title: true,
      abbreviation: true,
      description: true,
      category: true,
      author: true,
      releaseYear: true,
      thumbnailUrl: true,
      color: true,
    },
    with: {
      questions: {
        columns: {
          id: true,
          questionText: true,
          isReversed: true,
          order: true,
        },
        orderBy: (q, { asc }) => [asc(q.order)],
        with: {
          options: {
            columns: {
              label: true,
              value: true,
              order: true,
            },
            orderBy: (o, { asc }) => [asc(o.order)],
          },
        },
      },
    },
  });

  if (!testWithQuestions || testWithQuestions.questions.length === 0) {
    notFound();
  }

  // ── Map DB rows → AssessmentForm Question[] contract ──────────
  const testQuestions: Question[] = testWithQuestions.questions.map((q) => ({
    id: q.id,
    text: q.questionText,
    reversed: q.isReversed || undefined,
    options: q.options.map(
      (o): AnswerOption => ({
        label: o.label,
        value: o.value,
      })
    ),
  }));

  const testMeta: TestMeta = {
    slug: testWithQuestions.slug,
    title: testWithQuestions.title,
    abbreviation: testWithQuestions.abbreviation,
    description: testWithQuestions.description,
    category: testWithQuestions.category,
    author: testWithQuestions.author,
    releaseYear: testWithQuestions.releaseYear,
    thumbnailUrl: testWithQuestions.thumbnailUrl,
    color: testWithQuestions.color ?? "#9B8EC4",
    questionCount: testQuestions.length,
  };

  // ── Session UUID Validation ─────────────────────────────
  const isValidUUID = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!sessionId || !isValidUUID(sessionId)) {
    redirect(`/test/${slug}/briefing`);
  }

  // ── Fetch Resume State ────────────────────────────────
  let initialAnswers: Record<string, unknown> = {};
  try {
    const sessionAnswers = await db.select().from(answers).where(eq(answers.sessionId, sessionId));
    initialAnswers = sessionAnswers.reduce(
      (acc, a) => {
        acc[a.questionId] = a.value;
        return acc;
      },
      {} as Record<string, unknown>
    );
  } catch (err) {
    console.error("[TestPage] Failed to fetch session answers:", err);
  }

  return (
    <AssessmentForm
      testMeta={testMeta}
      questions={testQuestions}
      sessionId={sessionId}
      initialAnswers={initialAnswers}
    />
  );
}
