"use client";

/**
 * ProgressBar — Assessment progress indicator.
 *
 * Stateless. Receives current/total as props and renders:
 *   - Animated fill bar with brand gradient
 *   - "Question X of Y" label using Outfit font for numerals
 *   - Percentage badge
 *   - Encouragement text (Indonesian, phase-aware)
 *   - Time remaining estimate
 *
 * Touch target: N/A (non-interactive element).
 */

import { useMemo } from "react";
import { Sparkles, Clock } from "lucide-react";

interface ProgressBarProps {
  /** Number of answered questions. */
  current: number;
  /** Total number of questions. */
  total: number;
  /** Optional accent color override (hex). Falls back to CSS --primary. */
  accentColor?: string;
  /** Indonesian encouragement message for current progress phase. */
  encouragement?: string;
  /** Estimated time remaining string. */
  timeRemaining?: string;
}

export function ProgressBar({
  current,
  total,
  accentColor,
  encouragement,
  timeRemaining,
}: ProgressBarProps) {
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

      {/* Track — brand gradient fill */}
      <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-[#E8EDF8]">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--brand-primary,#9B8EC4)] to-[var(--brand-primary-dark,#6B5CA0)]"
          style={{
            width: `${percentage}%`,
            transition: "width 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Shimmer effect on the fill edge */}
        {percentage > 0 && percentage < 100 && (
          <div
            className="absolute inset-y-0 w-8 animate-pulse rounded-full opacity-30"
            style={{
              left: `calc(${percentage}% - 16px)`,
              background: `radial-gradient(ellipse, ${accentColor ?? "var(--brand-primary, #9B8EC4)"}, transparent)`,
            }}
          />
        )}
      </div>

      {/* Encouragement + time remaining */}
      {encouragement && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--brand-primary,#9B8EC4)]">
            <Sparkles size={13} />
            <span>{encouragement}</span>
          </div>
          {timeRemaining && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
              <Clock size={11} />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
