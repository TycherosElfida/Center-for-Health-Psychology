"use client";

/**
 * ScoreVisualizer — Responsive SVG chart for dimension scores.
 *
 * Pure SVG bar chart (no Recharts dependency) with:
 *   - Hover tooltips with score/max detail
 *   - Animated bar fill transitions on mount
 *   - Percentage labels at bar tips
 *   - Responsive viewBox scaling
 *
 * Takes the dimensionScores map from the scoring engine and test metadata
 * to compute percentage fills and colour per bar.
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
  /** Dimension name → raw score */
  dimensionScores: Record<string, number>;
  /** Brand color for the test */
  accentColor: string;
  /** Test-specific dimension max scores. Keys must match dimensionScores. */
  dimensionMaxScores?: Record<string, number>;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ScoreVisualizer({
  dimensionScores,
  accentColor,
  dimensionMaxScores,
}: ScoreVisualizerProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const bars: DimensionBar[] = useMemo(() => {
    const entries = Object.entries(dimensionScores);
    if (entries.length === 0) return [];

    // If no explicit max scores provided, infer from the highest value
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

  if (bars.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No dimension data available.
      </div>
    );
  }

  // SVG coordinates
  const barH = 28;
  const gap = 16;
  const labelW = 120;
  const pctW = 55;
  const padX = 16;
  const padY = 28;
  const chartW = 600;
  const barAreaW = chartW - labelW - pctW - padX * 2;
  const totalH = padY * 2 + bars.length * (barH + gap) - gap;

  return (
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
                {bar.label.length > 16 ? bar.label.slice(0, 14) + "…" : bar.label}
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
              {barWidth > 50 && (
                <text
                  x={labelW + padX + barWidth - 8}
                  y={y + barH / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  style={{ fontSize: 11, fill: "white", fontWeight: 600 }}
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
                style={{ fontSize: 13, fill: bar.color, fontWeight: 700 }}
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
  );
}
