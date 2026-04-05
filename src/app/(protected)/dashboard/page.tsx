/**
 * /dashboard/page.tsx — User Dashboard (RSC)
 *
 * Displays the authenticated user's assessment history with
 * status, scores, and quick links to results.
 *
 * Data flow:
 *   1. verifySession() → userId (DAL, cached per render)
 *   2. Direct DB query → user's claimed sessions + results
 *   3. Static test metadata lookup for display names/colors
 *
 * Zero client JS shipped from this layer (except interactive children).
 */

import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";

import { db } from "@/server/db";
import { testSessions, results } from "@/server/schema/sessions";
import { tests } from "@/server/schema/tests";
import { verifySession } from "@/lib/auth/dal";
import { getTestMeta } from "@/lib/data/tests";
import {
  LayoutDashboard,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

/* ═══════════════════════════════════════════════════════
   Metadata
   ═══════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Dashboard — CHP",
  description: "View your assessment history and saved results.",
  robots: { index: false, follow: false },
};

/* ═══════════════════════════════════════════════════════
   Page Component (RSC)
   ═══════════════════════════════════════════════════════ */

export default async function DashboardPage() {
  const session = await verifySession();

  // Fetch user's sessions with results + test info
  const sessions = await db
    .select({
      sessionId: testSessions.id,
      status: testSessions.status,
      startedAt: testSessions.startedAt,
      completedAt: testSessions.completedAt,
      testSlug: tests.slug,
      testTitle: tests.title,
      resultId: results.id,
      totalScore: results.totalScore,
      resultLabel: results.resultLabel,
    })
    .from(testSessions)
    .innerJoin(tests, eq(testSessions.testId, tests.id))
    .leftJoin(results, eq(testSessions.id, results.sessionId))
    .where(eq(testSessions.userId, session.userId))
    .orderBy(desc(testSessions.startedAt))
    .limit(50);

  const completedCount = sessions.filter((s) => s.status === "completed").length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Dashboard Header ── */}
      <header className="border-b border-border/50 bg-card">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-sm font-bold text-foreground no-underline"
          >
            Center for Health Psychology
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-16 pt-10">
        {/* ── Welcome Section ── */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-[var(--brand-primary,#9B8EC4)]" />
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
              Dashboard
            </h1>
          </div>
          <p className="text-[15px] text-muted-foreground">
            Riwayat asesmen dan hasil Anda tersimpan di sini.
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<FileText size={18} />}
            label="Total Asesmen"
            value={String(sessions.length)}
            color="var(--brand-primary, #9B8EC4)"
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Selesai"
            value={String(completedCount)}
            color="#48BB78"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Berlangsung"
            value={String(sessions.length - completedCount)}
            color="#ED8936"
          />
        </div>

        {/* ── Session History ── */}
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-10 text-center">
            <BarChart3 size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <h2 className="mb-2 font-heading text-lg font-bold text-foreground">
              Belum Ada Asesmen
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Anda belum memiliki asesmen yang tersimpan. Mulai asesmen pertama Anda dan simpan
              hasilnya ke dashboard ini.
            </p>
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary,#9B8EC4)] px-5 py-2.5 text-sm font-semibold text-white no-underline transition-all hover:brightness-110"
            >
              Jelajahi Asesmen
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-foreground">Riwayat Asesmen</h2>
            {sessions.map((s) => {
              const testMeta = getTestMeta(s.testSlug);
              const color = testMeta?.color ?? "var(--brand-primary, #9B8EC4)";
              const isCompleted = s.status === "completed";
              const date = new Date(s.startedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={s.sessionId}
                  className="flex items-center justify-between rounded-2xl border bg-card p-4 transition-all hover:shadow-md"
                  style={{
                    borderColor: `color-mix(in oklch, ${color} 12%, transparent)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Color dot */}
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <div className="font-heading text-sm font-semibold text-foreground">
                        {testMeta?.shortName ?? s.testTitle}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{date}</span>
                        {isCompleted && s.totalScore !== null && (
                          <>
                            <span>·</span>
                            <span className="font-medium" style={{ color }}>
                              Score: {Number(s.totalScore)}
                            </span>
                          </>
                        )}
                        {isCompleted && s.resultLabel && (
                          <>
                            <span>·</span>
                            <span>{s.resultLabel}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  {isCompleted && s.resultId ? (
                    <Link
                      href={`/results/${s.resultId}`}
                      className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold no-underline transition-colors"
                      style={{
                        background: `color-mix(in oklch, ${color} 8%, transparent)`,
                        color,
                      }}
                    >
                      Lihat Hasil
                      <ArrowRight size={12} />
                    </Link>
                  ) : (
                    <span
                      className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium"
                      style={{
                        background: "var(--secondary, #F7FAFC)",
                        color: "var(--muted-foreground, #718096)",
                      }}
                    >
                      <Clock size={12} />
                      Berlangsung
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="mt-8">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-[13px] font-semibold text-muted-foreground no-underline transition-colors hover:bg-secondary"
          >
            <FileText size={14} />
            Semua Asesmen
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════ */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl border bg-card p-4"
      style={{
        borderColor: `color-mix(in oklch, ${color} 10%, transparent)`,
      }}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-heading text-2xl font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
