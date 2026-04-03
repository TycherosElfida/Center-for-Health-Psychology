"use client";

/**
 * BinaryOptions — Two-card toggle for Yes/No or dichotomous questions.
 *
 * Premium UX from DesignReference:
 *   - grid grid-cols-2 gap-4 layout
 *   - Selected: gradient bg + 2.5px brand border + survey-pulse on icon
 *   - Unselected positive: #E8F5E9 bg, ✓ in #66BB6A
 *   - Unselected negative: #FFF3E0 bg, ✗ in #FFA726
 *   - "Press 1" / "Press 2" keyboard hints (10px, #C4B8E0)
 *   - binary-option class for CSS hover handler
 *   - WCAG touch targets ≥ 44×72px
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
  const color = accentColor ?? "var(--brand-primary, #9B8EC4)";

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
            className="binary-option group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-none py-7 outline-none transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    ? "#E8F5E9"
                    : "#FFF3E0",
                animation: isSelected ? "surveyPulse 0.3s ease-out" : undefined,
              }}
            >
              <span
                className="text-[22px]"
                style={{
                  color: isSelected ? "white" : isPositive ? "#66BB6A" : "#FFA726",
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
              className="text-[10px] font-medium"
              style={{
                color: "#C4B8E0",
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
