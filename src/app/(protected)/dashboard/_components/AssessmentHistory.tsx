"use client";

/**
 * AssessmentHistory — Client-side interactive assessment history.
 *
 * Renders filter tabs and a 2-column card grid of completed assessments.
 * Designed to match the reference portal UI with:
 *   - Abbreviation badge pills
 *   - Score / maxScore display with percentage
 *   - Progress bar
 *   - Date display
 *   - "View Full Analysis" CTA
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, TrendingUp, ClipboardList } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface AssessmentCardData {
  sessionId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  testSlug: string;
  testTitle: string;
  testAbbreviation: string;
  testColor: string | null;
  thumbnailUrl: string | null;
  resultId: string | null;
  totalScore: string | null;
  resultLabel: string | null;
  maxPossibleScore: number | null;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function AssessmentHistory({ sessions }: { sessions: AssessmentCardData[] }) {
  // Extract unique abbreviations for filter tabs
  const abbreviations = useMemo(() => {
    const abbrs = new Set<string>();
    sessions.forEach((s) => {
      if (s.testAbbreviation) abbrs.add(s.testAbbreviation);
    });
    return Array.from(abbrs);
  }, [sessions]);

  const [activeFilter, setActiveFilter] = useState("Semua");

  const filteredSessions = useMemo(() => {
    if (activeFilter === "Semua") return sessions;
    return sessions.filter((s) => s.testAbbreviation === activeFilter);
  }, [sessions, activeFilter]);

  return (
    <section
      className="rounded-2xl border bg-card p-6 sm:p-8"
      style={{
        borderColor: "var(--border-subtle, #E2DCF0)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* ── Header + Filter Tabs ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--brand-primary-light, #EDE9F8)" }}
          >
            <TrendingUp size={20} style={{ color: "var(--brand-primary-dark, #6B5CA0)" }} />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Riwayat Asesmen</h2>
            <p className="text-xs text-muted-foreground">{sessions.length} hasil</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {["Semua", ...abbreviations].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200"
              style={{
                backgroundColor:
                  activeFilter === tab ? "var(--brand-primary-dark, #6B5CA0)" : "transparent",
                color: activeFilter === tab ? "#ffffff" : "var(--text-body, #4A5568)",
                border:
                  activeFilter === tab
                    ? "1.5px solid var(--brand-primary-dark, #6B5CA0)"
                    : "1.5px solid var(--border-subtle, #E2DCF0)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards Grid ── */}
      {filteredSessions.length === 0 ? (
        <div
          className="rounded-xl border border-dashed p-8 text-center"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <p className="text-sm text-muted-foreground">
            Tidak ada asesmen ditemukan untuk filter ini.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2"
          style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "4px" }}
        >
          {filteredSessions.map((s) => {
            const color = s.testColor ?? "var(--brand-primary, #9B8EC4)";
            const isCompleted = s.status === "completed";
            const score = s.totalScore !== null ? Number(s.totalScore) : null;
            const maxScore = s.maxPossibleScore ?? null;
            const percentage =
              score !== null && maxScore !== null && maxScore > 0
                ? Math.round((score / maxScore) * 100)
                : null;

            const date = new Date(s.completedAt ?? s.startedAt).toLocaleDateString("id-ID", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={s.sessionId}
                className="group flex flex-col rounded-2xl border bg-card p-5 transition-all duration-200 hover:shadow-lg"
                style={{
                  borderColor: `color-mix(in oklch, ${color} 20%, var(--border-subtle, #E2DCF0))`,
                }}
              >
                {/* ── Card Header: Thumbnail + Badge ── */}
                <div className="mb-3 flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${color} 12%, white)`,
                    }}
                  >
                    {s.thumbnailUrl ? (
                      <Image
                        src={s.thumbnailUrl}
                        alt={s.testAbbreviation}
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ClipboardList size={18} style={{ color }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="mb-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${color} 10%, white)`,
                        color,
                        border: `1px solid color-mix(in oklch, ${color} 20%, transparent)`,
                      }}
                    >
                      {s.testAbbreviation}
                    </span>
                    <h3 className="text-sm font-semibold leading-tight text-foreground">
                      {s.testTitle}
                    </h3>
                  </div>
                </div>

                {/* ── Score Display ── */}
                {isCompleted && score !== null ? (
                  <div className="mb-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span
                          className="font-heading text-3xl font-extrabold"
                          style={{ color: "var(--text-heading, #1A202C)" }}
                        >
                          {Math.round(score)}
                        </span>
                        {maxScore !== null && (
                          <span className="text-sm font-medium text-muted-foreground">
                            / {Math.round(maxScore)}
                          </span>
                        )}
                      </div>
                      {percentage !== null && (
                        <span className="text-sm font-bold" style={{ color }}>
                          {percentage}%
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {percentage !== null && (
                      <div
                        className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: `color-mix(in oklch, ${color} 12%, white)` }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Sedang berlangsung…
                    </span>
                  </div>
                )}

                {/* ── Date ── */}
                <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  <span>{date}</span>
                </div>

                {/* ── CTA Button ── */}
                {isCompleted && s.resultId ? (
                  <Link
                    href={`/results/${s.resultId}`}
                    className="mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white no-underline transition-all duration-200 hover:brightness-110"
                    style={{
                      background: `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 80%, #4A3580))`,
                      boxShadow: `0 4px 16px color-mix(in oklch, ${color} 30%, transparent)`,
                    }}
                  >
                    Lihat Analisis Lengkap
                  </Link>
                ) : (
                  <div
                    className="mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
                    style={{
                      backgroundColor: "var(--surface-subtle, #F5F3FA)",
                      color: "var(--text-muted, #718096)",
                    }}
                  >
                    Asesmen sedang berlangsung
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Back to Assessments ── */}
      <div className="mt-6 flex justify-center">
        <Link
          href="/tests"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white no-underline transition-all duration-200 hover:brightness-110"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))",
            boxShadow: "0 4px 16px rgba(107, 92, 160, 0.25)",
          }}
        >
          <ArrowLeft size={14} />
          Kembali ke Asesmen
        </Link>
      </div>
    </section>
  );
}
