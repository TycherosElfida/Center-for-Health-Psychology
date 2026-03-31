"use client";

/**
 * BinaryOptions — Two-card toggle for Yes/No or dichotomous questions.
 *
 * Stateless. Receives options, selection state, and onChange callback.
 * Renders two large touch-friendly cards side-by-side with hover lift,
 * active-state borders, and a pop animation on selection.
 *
 * Touch targets: each card is the full grid cell (≥ 44×72px on mobile).
 * Keyboard: each card is a <button> with radio semantics and focus-visible.
 */

import React from "react";
import type { AnswerOption } from "@/lib/types/assessment";

interface BinaryOptionsProps {
  /** Exactly two options. */
  options: AnswerOption[];
  /** Currently selected value, or undefined if unanswered. */
  selectedValue?: number;
  /** Callback when user selects an option. */
  onChange: (value: number) => void;
  /** Accent color (hex). Falls back to CSS --primary. */
  accentColor?: string;
}

export const BinaryOptions = React.memo(function BinaryOptions({
  options,
  selectedValue,
  onChange,
  accentColor,
}: BinaryOptionsProps) {
  const color = accentColor ?? "var(--primary)";

  return (
    <div className="grid grid-cols-2 gap-4" role="radiogroup">
      {options.map((opt, i) => {
        const isSelected = selectedValue === opt.value;
        const isPositive = opt.label.toLowerCase() === "yes" || opt.value === 1;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            onClick={() => onChange(opt.value)}
            className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-none py-7 outline-none transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{
              background: isSelected
                ? `linear-gradient(135deg, color-mix(in oklch, ${color} 12%, transparent), color-mix(in oklch, ${color} 6%, transparent))`
                : "var(--card)",
              border: isSelected ? `2.5px solid ${color}` : "2px solid var(--border)",
              boxShadow: isSelected
                ? `0 6px 20px color-mix(in oklch, ${color} 18%, transparent)`
                : "0 1px 4px rgba(0,0,0,0.02)",
            }}
          >
            {/* Icon circle */}
            <div
              className="flex items-center justify-center rounded-full transition-all duration-200"
              style={{
                width: 48,
                height: 48,
                background: isSelected
                  ? `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 75%, white))`
                  : isPositive
                    ? "oklch(0.94 0.04 145)"
                    : "oklch(0.95 0.04 70)",
                animation: isSelected ? "surveyPulse 0.3s ease-out" : undefined,
              }}
            >
              <span
                className="text-[22px]"
                style={{
                  color: isSelected
                    ? "white"
                    : isPositive
                      ? "oklch(0.65 0.15 145)"
                      : "oklch(0.72 0.12 70)",
                }}
              >
                {isPositive ? "✓" : "✗"}
              </span>
            </div>

            {/* Label */}
            <span
              className="font-heading transition-all duration-200"
              style={{
                fontSize: 17,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? color : "var(--muted-foreground)",
              }}
            >
              {opt.label}
            </span>

            {/* Keyboard hint */}
            <span
              className="text-[10px] font-medium transition-colors"
              style={{
                color: isSelected
                  ? `color-mix(in oklch, ${color} 60%, transparent)`
                  : "var(--muted-foreground)",
                opacity: 0.6,
              }}
            >
              Press {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
});
