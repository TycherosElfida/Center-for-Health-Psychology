"use client";

/**
 * ScoreVisualizer — Responsive visualization of assessment scores.
 *
 * Two visual elements:
 *   1. Radial gauge (SVG arc) showing totalScore / maxScore
 *   2. Horizontal bar chart for subscale dimension breakdown
 *
 * Props match the user specification:
 *   - totalScore, dimensionScores, resultLabel, testTitle
 *   - accentColor, maxScore (optional, defaults 100)
 *
 * Typography enforcement: Outfit for score numbers (inline font-family),
 * Inter for labels (inherits from body).
 *
 * Zero external charting dependencies — pure SVG.
 */

import { useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */

const CHART_COLORS = [
  "#9B8EC4",
  "#6BA3BE",
  "#F6AD55",
  "#FC8181",
  "#4DB6AC",
  "#B3A8D4",
  "#ED8796",
  "#A6D189",
];

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface DimensionBar {
  label: string;
  score: number;
  max: number;
  pct: number;
  color: string;
}

interface ScoreVisualizerProps {
  /** Total computed score */
  totalScore: number;
  /** Dimension name → raw score */
  dimensionScores: Record<string, number>;
  /** Severity/interpretation label (e.g., "Moderate Stress") */
  resultLabel: string;
  /** Full test name for display */
  testTitle: string;
  /** Brand color for the test */
  accentColor: string;
  /** Maximum achievable score (default 100) */
  maxScore?: number;
  /** Per-dimension max scores. Keys must match dimensionScores. */
  dimensionMaxScores?: Record<string, number>;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ScoreVisualizer({
  totalScore,
  dimensionScores,
  resultLabel,
  testTitle,
  accentColor,
  maxScore = 100,
  dimensionMaxScores,
}: ScoreVisualizerProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const scorePct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  /* ── Dimension bars ─────────────────────────────── */
  const bars: DimensionBar[] = useMemo(() => {
    const entries = Object.entries(dimensionScores);
    if (entries.length === 0) return [];

    const inferredMax = Math.max(...entries.map(([, v]) => v), 1);

    return entries.map(([label, score], i) => {
      const max = dimensionMaxScores?.[label] ?? inferredMax;
      const pct = max > 0 ? Math.round((score / max) * 100) : 0;
      return {
        label,
        score,
        max,
        pct: Math.min(pct, 100),
        color: CHART_COLORS[i % CHART_COLORS.length] ?? "#9B8EC4",
      };
    });
  }, [dimensionScores, dimensionMaxScores]);

  const hasDimensions = bars.length > 0;

  /* ── SVG Chart Geometry ─────────────────────────── */
  const barH = 28;
  const gap = 16;
  const labelW = 130;
  const pctW = 55;
  const padX = 16;
  const padY = 28;
  const chartW = 600;
  const barAreaW = chartW - labelW - pctW - padX * 2;
  const totalH = hasDimensions ? padY * 2 + bars.length * (barH + gap) - gap : 0;

  /* ── Radial Gauge Geometry ──────────────────────── */
  const R = 82;
  const C = 2 * Math.PI * R;
  const arcLen = (scorePct / 100) * C;

  return (
    <div className="flex flex-col gap-6">
      {/* ═══ Radial Gauge Card ═══ */}
      <div
        className="overflow-hidden rounded-3xl border bg-card"
        style={{
          borderColor: `color-mix(in oklch, ${accentColor} 12%, transparent)`,
          boxShadow: `0 8px 40px color-mix(in oklch, ${accentColor} 6%, transparent)`,
        }}
      >
        {/* Accent bar */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, color-mix(in oklch, ${accentColor} 40%, transparent))`,
          }}
        />

        <div className="p-6 sm:p-8">
          {/* Test title — Outfit */}
          <p
            className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            style={{ fontFamily: "var(--font-heading), var(--font-sans), sans-serif" }}
          >
            {testTitle}
          </p>

          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-center">
            {/* SVG radial gauge */}
            <div className="relative shrink-0">
              <svg width={200} height={200} viewBox="0 0 200 200">
                {/* Background track */}
                <circle
                  cx={100}
                  cy={100}
                  r={R}
                  fill="none"
                  stroke={`color-mix(in oklch, ${accentColor} 12%, transparent)`}
                  strokeWidth={18}
                />
                {/* Score arc */}
                <circle
                  cx={100}
                  cy={100}
                  r={R}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={18}
                  strokeLinecap="round"
                  strokeDasharray={`${arcLen} ${C}`}
                  transform="rotate(-90 100 100)"
                  style={{ transition: "stroke-dasharray 1.2s ease" }}
                />
              </svg>
              {/* Center score — Outfit */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-4xl font-extrabold"
                  style={{
                    color: accentColor,
                    lineHeight: 1,
                    fontFamily: "var(--font-heading), var(--font-sans), sans-serif",
                  }}
                >
                  {totalScore}
                </span>
                <span className="mt-1 text-[13px] text-muted-foreground">/ {maxScore}</span>
              </div>
            </div>

            {/* Interpretation panel */}
            <div className="min-w-0 flex-1 text-center lg:text-left">
              {/* Result label pill */}
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                style={{
                  background: `color-mix(in oklch, ${accentColor} 10%, transparent)`,
                  border: `1px solid color-mix(in oklch, ${accentColor} 25%, transparent)`,
                }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: accentColor,
                    boxShadow: `0 0 6px ${accentColor}`,
                  }}
                />
                <span
                  className="text-sm font-bold"
                  style={{
                    color: accentColor,
                    fontFamily: "var(--font-heading), var(--font-sans), sans-serif",
                  }}
                >
                  {resultLabel}
                </span>
              </div>

              {/* Percentage — Outfit */}
              <p
                className="text-3xl font-extrabold text-foreground"
                style={{ fontFamily: "var(--font-heading), var(--font-sans), sans-serif" }}
              >
                {scorePct}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">of maximum score</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Dimension Breakdown Chart ═══ */}
      {hasDimensions && (
        <div className="rounded-3xl border border-border/50 bg-card p-5 sm:p-6">
          <h3
            className="mb-1 text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading), var(--font-sans), sans-serif" }}
          >
            Subscale Breakdown
          </h3>
          <p className="mb-6 text-[13px] text-muted-foreground">
            Detailed analysis across {bars.length} dimensions
          </p>

          <div className="w-full overflow-x-auto">
            <svg
              width="100%"
              viewBox={`0 0 ${chartW} ${totalH}`}
              className="block"
              style={{ maxWidth: chartW }}
              role="img"
              aria-label="Dimension score chart"
            >
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const x = labelW + padX + (pct / 100) * barAreaW;
                return (
                  <g key={`grid-${pct}`}>
                    <line
                      x1={x}
                      y1={padY - 4}
                      x2={x}
                      y2={totalH - padY + 4}
                      stroke="var(--border)"
                      strokeWidth={1}
                      strokeDasharray="4 3"
                      opacity={0.5}
                    />
                    <text
                      x={x}
                      y={padY - 10}
                      textAnchor="middle"
                      style={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {bars.map((bar, i) => {
                const y = padY + i * (barH + gap);
                const barWidth = (bar.pct / 100) * barAreaW;
                const isHovered = hoveredIdx === i;

                return (
                  <g
                    key={bar.label}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{ cursor: "default" }}
                  >
                    {/* Label */}
                    <text
                      x={labelW - 8}
                      y={y + barH / 2}
                      textAnchor="end"
                      dominantBaseline="central"
                      style={{ fontSize: 12, fill: "var(--foreground)" }}
                    >
                      {bar.label.length > 18 ? bar.label.slice(0, 16) + "…" : bar.label}
                    </text>

                    {/* Background track */}
                    <rect
                      x={labelW + padX}
                      y={y}
                      width={barAreaW}
                      height={barH}
                      rx={6}
                      fill="var(--secondary)"
                    />

                    {/* Filled bar */}
                    <rect
                      x={labelW + padX}
                      y={y}
                      width={Math.max(4, barWidth)}
                      height={barH}
                      rx={6}
                      fill={bar.color}
                      opacity={isHovered ? 1 : 0.85}
                      style={{ transition: "width 0.8s ease, opacity 0.2s" }}
                    />

                    {/* Score inside bar (if wide enough) */}
                    {barWidth > 55 && (
                      <text
                        x={labelW + padX + barWidth - 8}
                        y={y + barH / 2}
                        textAnchor="end"
                        dominantBaseline="central"
                        style={{
                          fontSize: 11,
                          fill: "white",
                          fontWeight: 600,
                          fontFamily: "var(--font-heading), var(--font-sans), sans-serif",
                        }}
                      >
                        {bar.score}/{bar.max}
                      </text>
                    )}

                    {/* Percentage label */}
                    <text
                      x={labelW + padX + barAreaW + 12}
                      y={y + barH / 2}
                      textAnchor="start"
                      dominantBaseline="central"
                      style={{
                        fontSize: 13,
                        fill: bar.color,
                        fontWeight: 700,
                        fontFamily: "var(--font-heading), var(--font-sans), sans-serif",
                      }}
                    >
                      {bar.pct}%
                    </text>

                    {/* Hover tooltip */}
                    {isHovered && (
                      <g>
                        <rect
                          x={labelW + padX + barWidth / 2 - 50}
                          y={y - 30}
                          width={100}
                          height={24}
                          rx={8}
                          fill="var(--foreground)"
                          opacity={0.9}
                        />
                        <text
                          x={labelW + padX + barWidth / 2}
                          y={y - 18}
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{ fontSize: 11, fill: "var(--background)" }}
                        >
                          {bar.score}/{bar.max} ({bar.pct}%)
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Accent bottom bar */}
              <rect
                x={0}
                y={totalH - 3}
                width={chartW}
                height={3}
                fill={accentColor}
                rx={1.5}
                opacity={0.15}
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
