"use client";

/**
 * ResultsDashboard — Client-side orchestrator for the results page.
 *
 * Sections:
 *   1. Completion badge + title
 *   2. Score overview card (ring + interpretation pill)
 *   3. Subscale breakdown chart (ScoreVisualizer)
 *   4. Affirmation section (warm background, crisis hotlines)
 *   5. Clinical disclaimer
 *   6. Email lead capture (ReportRequestForm)
 *   7. Retake + explore other tests
 *
 * Admin privacy: NO item-level responses are rendered here.
 */

import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  Heart,
  ArrowRight,
  RefreshCw,
  Home,
  Phone,
} from "lucide-react";
import type { TestMeta } from "@/lib/data/tests";
import type { ScoreInterpretation } from "@/lib/scoring/interpretation";
import { TESTS } from "@/lib/data/tests";

import { ScoreVisualizer } from "./ScoreVisualizer";
import { ReportRequestForm } from "./ReportRequestForm";

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface ResultsDashboardProps {
  scoreId: string;
  testMeta: TestMeta;
  totalScore: number;
  dimensionScores: Record<string, number>;
  interpretation: ScoreInterpretation;
  completedAt: string;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ResultsDashboard({
  scoreId,
  testMeta,
  totalScore,
  dimensionScores,
  interpretation,
  completedAt,
}: ResultsDashboardProps) {
  const maxScore = testMeta.maxScore ?? 100;
  const scorePct = Math.round((totalScore / maxScore) * 100);
  const hasDimensions = Object.keys(dimensionScores).length > 0;
  const otherTests = TESTS.filter((t) => t.id !== testMeta.id).slice(0, 4);

  // Format the completion date
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

        {/* ── Title ──────────────────────────────────── */}
        <div className="mb-10 text-center">
          <h1 className="font-heading text-[clamp(26px,4vw,38px)] font-extrabold tracking-tight text-foreground">
            Your {testMeta.shortName} Results
          </h1>
          <p className="mx-auto mt-2 max-w-[520px] text-[15px] text-muted-foreground">
            Comprehensive analysis of your assessment responses with detailed subscale breakdown.
            Completed {dateStr}.
          </p>
        </div>

        {/* ═══ Score Overview Card ═══ */}
        <div
          className="mb-6 overflow-hidden rounded-3xl border bg-card"
          style={{
            borderColor: `color-mix(in oklch, ${testMeta.color} 12%, transparent)`,
            boxShadow: `0 8px 40px color-mix(in oklch, ${testMeta.color} 6%, transparent)`,
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-1"
            style={{
              background: `linear-gradient(90deg, ${testMeta.color}, color-mix(in oklch, ${testMeta.color} 40%, transparent))`,
            }}
          />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center gap-8 lg:flex-row">
              {/* Score ring (pure SVG) */}
              <div className="relative shrink-0">
                <svg width={200} height={200} viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle
                    cx={100}
                    cy={100}
                    r={82}
                    fill="none"
                    stroke={`color-mix(in oklch, ${testMeta.color} 12%, transparent)`}
                    strokeWidth={18}
                  />
                  {/* Score arc */}
                  <circle
                    cx={100}
                    cy={100}
                    r={82}
                    fill="none"
                    stroke={testMeta.color}
                    strokeWidth={18}
                    strokeLinecap="round"
                    strokeDasharray={`${(scorePct / 100) * 2 * Math.PI * 82} ${2 * Math.PI * 82}`}
                    transform="rotate(-90 100 100)"
                    style={{ transition: "stroke-dasharray 1.2s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-heading text-4xl font-extrabold"
                    style={{ color: testMeta.color, lineHeight: 1 }}
                  >
                    {totalScore}
                  </span>
                  <span className="mt-1 text-[13px] text-muted-foreground">/ {maxScore}</span>
                </div>
              </div>

              {/* Interpretation */}
              <div className="min-w-0 flex-1">
                {/* Severity pill */}
                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                  style={{
                    background: `color-mix(in oklch, ${interpretation.color} 10%, transparent)`,
                    border: `1px solid color-mix(in oklch, ${interpretation.color} 25%, transparent)`,
                  }}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: interpretation.color,
                      boxShadow: `0 0 6px ${interpretation.color}`,
                    }}
                  />
                  <span className="text-sm font-bold" style={{ color: interpretation.color }}>
                    {interpretation.label}
                  </span>
                </div>

                <p className="mb-5 text-[15px] leading-relaxed text-muted-foreground">
                  {interpretation.description}
                </p>

                {/* Stat pills */}
                <div className="flex flex-wrap gap-3">
                  <StatPill label="Score" value={`${scorePct}%`} color={testMeta.color} />
                  <StatPill label="Items" value={`${testMeta.itemCount}`} color="#718096" />
                  <StatPill label="Reliability" value={testMeta.alpha ?? "N/A"} color="#718096" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Subscale Breakdown ═══ */}
        {hasDimensions && (
          <div className="mb-6 rounded-3xl border border-border/50 bg-card p-5 sm:p-6">
            <h3 className="mb-1 font-heading text-lg font-bold text-foreground">
              Subscale Breakdown
            </h3>
            <p className="mb-6 text-[13px] text-muted-foreground">
              Detailed analysis across {Object.keys(dimensionScores).length} dimensions
            </p>
            <ScoreVisualizer dimensionScores={dimensionScores} accentColor={testMeta.color} />
          </div>
        )}

        {/* ═══ Words of Affirmation ═══ */}
        <div
          className="mb-6 rounded-2xl p-6"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklch, #f6d365 8%, var(--card)), color-mix(in oklch, #fda085 6%, var(--card)))",
            border: "1px solid color-mix(in oklch, #f6d365 18%, transparent)",
          }}
        >
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100/80">
              <Heart size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="mb-2 font-heading text-[15px] font-bold text-foreground">
                Pesan untuk Anda
              </h3>
              <p className="mb-4 text-[14px] leading-relaxed text-muted-foreground">
                {interpretation.severity === "high"
                  ? "Kami memahami bahwa hasilnya mungkin membuat Anda khawatir. Ingatlah bahwa ini adalah alat skrining, bukan diagnosis akhir. Langkah pertama yang berani adalah mencari bantuan — dan Anda sudah melakukannya dengan menyelesaikan assessment ini. Anda tidak sendirian."
                  : interpretation.severity === "moderate"
                    ? "Terima kasih telah meluangkan waktu untuk memahami diri Anda lebih baik. Hasil Anda menunjukkan ada area yang bisa Anda kembangkan. Dengan kesadaran dan usaha, perubahan positif sangat mungkin dicapai."
                    : "Selamat! Hasil Anda menunjukkan kondisi yang baik. Terus pertahankan kebiasaan sehat Anda dan jangan ragu untuk meninjau kembali secara berkala."}
              </p>

              {/* Crisis hotlines (always shown) */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "color-mix(in oklch, var(--card) 70%, transparent)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hotline Krisis
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <HotlineItem label="Into The Light Indonesia" number="119 ext. 8" />
                  <HotlineItem label="Sejiwa (Kemenkes RI)" number="119 ext. 8" />
                  <HotlineItem label="LSM Jangan Bunuh Diri" number="021-9696 9293" />
                  <HotlineItem label="Yayasan Pulih" number="(021) 788-42580" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Clinical Disclaimer ═══ */}
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
              <p className="mb-1.5 text-sm font-bold text-foreground">Clinical Disclaimer</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                This assessment is a screening tool intended for educational and research purposes
                only. It does not constitute a clinical diagnosis. Results should be interpreted by
                a qualified mental health professional. If you are experiencing distress, please
                contact a licensed practitioner or crisis helpline immediately.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Actions: Email + Retake ═══ */}
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

        {/* ═══ Assessment Information ═══ */}
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-5">
          <h4 className="mb-3 text-[13px] font-semibold text-muted-foreground">
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

        {/* ═══ Explore Other Tests ═══ */}
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

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{
        background: `color-mix(in oklch, ${color} 6%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function HotlineItem({ label, number }: { label: string; number: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{number}</span>
    </div>
  );
}
