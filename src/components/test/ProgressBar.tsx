"use client";

/**
 * ProgressBar — Assessment progress indicator.
 *
 * Stateless. Receives current/total as props and renders:
 *   - Animated fill bar with smooth CSS transition
 *   - "Question X of Y" label using Outfit font for numerals
 *   - Percentage badge
 *
 * Touch target: N/A (non-interactive element).
 */

import { useMemo } from "react";

interface ProgressBarProps {
  /** Number of answered questions. */
  current: number;
  /** Total number of questions. */
  total: number;
  /** Optional accent color override (hex). Falls back to CSS --primary. */
  accentColor?: string;
}

export function ProgressBar({ current, total, accentColor }: ProgressBarProps) {
  const percentage = useMemo(
    () => (total > 0 ? Math.round((current / total) * 100) : 0),
    [current, total]
  );

  return (
    <div className="flex flex-col gap-2.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p className="m-0 text-[13px] font-medium text-muted-foreground">
          Question{" "}
          <span
            className="font-heading text-[15px] font-bold text-foreground"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {current}
          </span>
          <span className="mx-0.5 text-muted-foreground/50">/</span>
          <span className="font-heading text-[13px] font-semibold text-muted-foreground/70">
            {total}
          </span>
        </p>

        {/* Percentage badge */}
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums"
          style={{
            backgroundColor: accentColor
              ? `color-mix(in oklch, ${accentColor} 12%, transparent)`
              : undefined,
            color: accentColor ?? undefined,
            border: accentColor
              ? `1px solid color-mix(in oklch, ${accentColor} 20%, transparent)`
              : undefined,
          }}
        >
          {percentage}%
        </span>
      </div>

      {/* Track */}
      <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-secondary">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${percentage}%`,
            background: accentColor
              ? `linear-gradient(90deg, ${accentColor}, color-mix(in oklch, ${accentColor} 75%, white))`
              : "linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--primary) 75%, white))",
            transition: "width 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Shimmer effect on the fill edge */}
        {percentage > 0 && percentage < 100 && (
          <div
            className="absolute inset-y-0 w-8 animate-pulse rounded-full opacity-30"
            style={{
              left: `calc(${percentage}% - 16px)`,
              background: `radial-gradient(ellipse, ${accentColor ?? "var(--primary)"}, transparent)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
