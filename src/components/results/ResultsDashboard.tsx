"use client";

/**
 * ResultsDashboard — Client-side orchestrator for the results page.
 *
 * Composes:
 *   1. Completion badge + title (Outfit headings)
 *   2. ScoreVisualizer (radial gauge + subscale bars)
 *   3. AffirmationSection (warm message + crisis hotlines)
 *   4. Clinical disclaimer
 *   5. ReportRequestForm (email lead capture via react-hook-form)
 *   6. Retake + explore other tests
 *
 * Privacy: NO item-level responses (answersSnapshot) are received or
 * rendered here. The RSC passes only totalScore + dimensionScores.
 *
 * Typography: Outfit (`font-heading`) for headings and score numbers.
 *             Inter (default body font) for descriptive text.
 */

import Link from "next/link";
import { CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Home } from "lucide-react";
import type { TestMeta } from "@/lib/data/tests";
import type { ScoreInterpretation } from "@/lib/scoring/interpretation";
import { TESTS } from "@/lib/data/tests";

import { ScoreVisualizer } from "./ScoreVisualizer";
import { AffirmationSection } from "./AffirmationSection";
import { ReportRequestForm } from "./ReportRequestForm";
import { ClaimCTA } from "./ClaimCTA";
import { AutoClaim } from "./AutoClaim";

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface ResultsDashboardProps {
  scoreId: string;
  sessionId: string;
  testMeta: TestMeta;
  totalScore: number;
  dimensionScores: Record<string, number>;
  interpretation: ScoreInterpretation;
  completedAt: string;
  isAuthenticated: boolean;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ResultsDashboard({
  scoreId,
  sessionId,
  testMeta,
  totalScore,
  dimensionScores,
  interpretation,
  completedAt,
  isAuthenticated,
}: ResultsDashboardProps) {
  const maxScore = testMeta.maxScore ?? 100;
  const otherTests = TESTS.filter((t) => t.id !== testMeta.id).slice(0, 4);

  // Format the completion date in Indonesian locale
  const completedDate = new Date(completedAt);
  const dateStr = completedDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="border-b border-border/50 bg-card">
        <div className="mx-auto flex h-14 max-w-[900px] items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-sm font-bold text-foreground no-underline"
          >
            Center for Health Psychology
          </Link>
          <Link
            href="/tests"
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-[13px] text-muted-foreground no-underline transition-colors hover:bg-secondary"
          >
            <Home size={13} />
            Tests
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 pb-16 pt-10">
        {/* ── Completion Badge ────────────────────────── */}
        <div className="mb-5 flex justify-center">
          <div
            className="flex items-center gap-2 rounded-full px-5 py-2 font-heading text-sm font-semibold"
            style={{
              background: `color-mix(in oklch, ${testMeta.color} 8%, transparent)`,
              border: `1px solid color-mix(in oklch, ${testMeta.color} 20%, transparent)`,
              color: testMeta.color,
            }}
          >
            <CheckCircle2 size={16} />
            Assessment Complete
          </div>
        </div>

        {/* ── Page Title — Outfit ──────────────────────── */}
        <div className="mb-10 text-center">
          <h1 className="font-heading text-[clamp(26px,4vw,38px)] font-extrabold tracking-tight text-foreground">
            Your {testMeta.shortName} Results
          </h1>
          <p className="mx-auto mt-2 max-w-[520px] text-[15px] text-muted-foreground">
            Comprehensive analysis of your assessment responses with detailed subscale breakdown.
            Completed {dateStr}.
          </p>
        </div>

        {/* ═══ 1. Score Visualizer (Radial gauge + bars) ═══ */}
        <div className="mb-6">
          <ScoreVisualizer
            totalScore={totalScore}
            dimensionScores={dimensionScores}
            resultLabel={interpretation.label}
            testTitle={testMeta.name}
            accentColor={testMeta.color}
            maxScore={maxScore}
          />
        </div>

        {/* ═══ 2. Words of Affirmation ═══ */}
        <div className="mb-6">
          <AffirmationSection severity={interpretation.severity} />
        </div>

        {/* ═══ 2.5. Claim CTA — Save Your Results (anonymous only) ═══ */}
        {!isAuthenticated && (
          <div className="mb-6">
            <ClaimCTA sessionId={sessionId} scoreId={scoreId} accentColor={testMeta.color} />
          </div>
        )}

        {/* ═══ 2.6. Auto-Claim — silent claim for authenticated users ═══ */}
        {isAuthenticated && <AutoClaim sessionId={sessionId} accentColor={testMeta.color} />}

        {/* ═══ 3. Clinical Disclaimer ═══ */}
        <div
          className="mb-6 rounded-2xl border p-5"
          style={{
            background: `color-mix(in oklch, ${testMeta.color} 3%, var(--card))`,
            borderColor: `color-mix(in oklch, ${testMeta.color} 10%, transparent)`,
          }}
        >
          <div className="flex gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="mb-1.5 font-heading text-sm font-bold text-foreground">
                Clinical Disclaimer
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                This assessment is a screening tool intended for educational and research purposes
                only. It does not constitute a clinical diagnosis. Results should be interpreted by
                a qualified mental health professional. If you are experiencing distress, please
                contact a licensed practitioner or crisis helpline immediately.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ 4. Actions: Email + Retake ═══ */}
        <div className="mb-6 flex flex-col gap-3">
          <ReportRequestForm
            scoreId={scoreId}
            testShortName={testMeta.shortName}
            accentColor={testMeta.color}
          />

          <Link
            href={`/test/${testMeta.id}/briefing`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/50 py-3.5 font-heading text-[15px] font-semibold text-muted-foreground no-underline transition-colors hover:bg-secondary"
          >
            <RefreshCw size={16} />
            Retake Assessment
          </Link>
        </div>

        {/* ═══ 5. Assessment Information ═══ */}
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-5">
          <h4 className="mb-3 font-heading text-[13px] font-semibold text-muted-foreground">
            Assessment Information
          </h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetaItem label="Scale" value={testMeta.shortName} />
            <MetaItem label="Items" value={String(testMeta.itemCount)} />
            <MetaItem label="Reliability (α)" value={testMeta.alpha ?? "N/A"} />
            <MetaItem label="Author" value={testMeta.author ?? "N/A"} />
          </div>
          {testMeta.validationNote && (
            <p className="mt-3 text-xs italic leading-relaxed text-muted-foreground">
              {testMeta.validationNote}
            </p>
          )}
        </div>

        {/* ═══ 6. Explore Other Tests ═══ */}
        {otherTests.length > 0 && (
          <div>
            <h3 className="mb-4 font-heading text-lg font-bold text-foreground">
              Explore Other Assessments
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {otherTests.map((t) => (
                <Link
                  key={t.id}
                  href={`/test/${t.id}/briefing`}
                  className="flex items-center justify-between rounded-2xl border bg-card p-4 no-underline transition-all hover:shadow-md"
                  style={{
                    borderColor: `color-mix(in oklch, ${t.color} 12%, transparent)`,
                  }}
                >
                  <div>
                    <div className="font-heading text-sm font-semibold text-foreground">
                      {t.shortName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.duration} · {t.itemCount} items
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: `color-mix(in oklch, ${t.color} 8%, transparent)`,
                      color: t.color,
                    }}
                  >
                    Start <ArrowRight size={12} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════ */

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-heading text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
