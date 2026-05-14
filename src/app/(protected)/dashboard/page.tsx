/**
 * /dashboard/page.tsx — User Dashboard (RSC)
 *
 * Displays the authenticated user's assessment history with
 * status, scores, and quick links to results.
 *
 * Data flow:
 *   1. verifySession() → userId (DAL, cached per render)
 *   2. Direct DB query → user info, claimed sessions + results
 *   3. Client component renders interactive filter tabs + card grid
 *
 * Zero client JS shipped from this layer (except interactive children).
 */

import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";

import { db } from "@/server/db";
import { testSessions, results } from "@/server/schema/sessions";
import { tests } from "@/server/schema/tests";
import { users } from "@/server/schema/users";
import { verifySession } from "@/lib/auth/dal";
import { Navbar } from "@/components/layout/Navbar";
import { FileText, BarChart3, Calendar, ClipboardList } from "lucide-react";
import { AssessmentHistory, type AssessmentCardData } from "./_components/AssessmentHistory";

/* ═══════════════════════════════════════════════════════
   Metadata
   ═══════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Portal — Center for Health Psychology",
  description: "View your assessment history and saved results.",
  robots: { index: false, follow: false },
};

/* ═══════════════════════════════════════════════════════
   Page Component (RSC)
   ═══════════════════════════════════════════════════════ */

export default async function DashboardPage() {
  const session = await verifySession();

  // Fetch user info for personalized greeting
  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const displayName = user?.name || user?.email?.split("@")[0] || "user";

  // Fetch user's sessions with results + test info
  const sessionRows = await db
    .select({
      sessionId: testSessions.id,
      status: testSessions.status,
      startedAt: testSessions.startedAt,
      completedAt: testSessions.completedAt,
      testSlug: tests.slug,
      testTitle: tests.title,
      testAbbreviation: tests.abbreviation,
      testColor: tests.color,
      testThumbnailUrl: tests.thumbnailUrl,
      resultId: results.id,
      totalScore: results.totalScore,
      resultLabel: results.resultLabel,
      computedScores: results.computedScores,
    })
    .from(testSessions)
    .innerJoin(tests, eq(testSessions.testId, tests.id))
    .leftJoin(results, eq(testSessions.id, results.sessionId))
    .where(eq(testSessions.userId, session.userId))
    .orderBy(desc(testSessions.startedAt))
    .limit(50);

  // Map to client-safe shape with maxPossibleScore extracted from JSONB
  const assessments: AssessmentCardData[] = sessionRows.map((s) => {
    const computed = (s.computedScores ?? {}) as Record<string, unknown>;
    const maxPossibleScore =
      typeof computed.maxPossibleScore === "number" ? computed.maxPossibleScore : null;

    return {
      sessionId: s.sessionId,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      testSlug: s.testSlug,
      testTitle: s.testTitle,
      testAbbreviation: s.testAbbreviation,
      testColor: s.testColor,
      thumbnailUrl: s.testThumbnailUrl,
      resultId: s.resultId,
      totalScore: s.totalScore,
      resultLabel: s.resultLabel,
      maxPossibleScore,
    };
  });

  const completedCount = assessments.filter((s) => s.status === "completed").length;

  // Last assessment date
  const lastAssessmentDate =
    completedCount > 0
      ? new Date(
          assessments.find((s) => s.status === "completed")!.completedAt ??
            assessments.find((s) => s.status === "completed")!.startedAt
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--surface-subtle, #F5F3FA)" }}>
      {/* ── Navbar ── */}
      <Navbar
        isAuthenticated
        variant="dashboard"
        userName={user?.name ?? null}
        userEmail={user?.email ?? null}
      />

      <main className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:px-8">
        {/* ── Welcome Section ── */}
        <div className="mb-8">
          <p
            className="mb-1 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--brand-primary-dark, #6B5CA0)" }}
          >
            Dashboard
          </p>
          <h1
            className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: "var(--text-heading, #1A202C)" }}
          >
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your psychological assessment journey
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={<ClipboardList size={20} />}
            label="Total Assessments"
            value={String(assessments.length)}
          />
          <StatCard
            icon={<Calendar size={20} />}
            label="Last Assessment"
            value={lastAssessmentDate}
          />
        </div>

        {/* ── Assessment History ── */}
        {assessments.length === 0 ? (
          <div
            className="rounded-2xl border bg-card p-10 text-center"
            style={{
              borderColor: "var(--border-subtle, #E2DCF0)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <BarChart3
              size={48}
              className="mx-auto mb-4"
              style={{ color: "var(--brand-primary-mid, #C5BADF)" }}
            />
            <h2 className="mb-2 font-heading text-lg font-bold text-foreground">
              No Assessments Yet
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              You haven&apos;t completed any assessments yet. Start your first assessment and your
              results will appear here.
            </p>
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white no-underline transition-all hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))",
                boxShadow: "var(--shadow-button)",
              }}
            >
              <FileText size={16} />
              Explore Assessments
            </Link>
          </div>
        ) : (
          <AssessmentHistory sessions={assessments} />
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════ */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border bg-card p-5"
      style={{
        borderColor: "var(--border-subtle, #E2DCF0)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "var(--brand-primary-light, #EDE9F8)",
          color: "var(--brand-primary-dark, #6B5CA0)",
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className="font-heading text-xl font-extrabold sm:text-2xl"
          style={{ color: "var(--text-heading, #1A202C)" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
