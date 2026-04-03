"use client";

/**
 * LikertScale — Horizontal visual scale for Likert-type questions.
 *
 * Premium UX from DesignReference:
 *   - Unselected circle: 28px, white fill, #DDD7EE border
 *   - Selected circle: 40px, gradient fill, survey-check-pop animation
 *   - Connecting track line with gradient fill
 *   - Endpoint labels row (italic, muted)
 *   - Spring-like cubic-bezier transition
 *   - WCAG 2.5.5 Level AAA touch targets (≥ 44px)
 *   - likert-option class for CSS hover handler
 */

import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { AnswerOption } from "@/lib/types/assessment";

interface LikertScaleProps {
  /** The options to display. */
  options: AnswerOption[];
  /** Currently selected value, or undefined if unanswered. */
  selectedValue?: number;
  /** Callback when user selects an option. */
  onChange: (value: number) => void;
  /** Accent color (hex). Falls back to CSS --primary. */
  accentColor?: string;
}

export const LikertScale = React.memo(function LikertScale({
  options,
  selectedValue,
  onChange,
  accentColor,
}: LikertScaleProps) {
  const color = accentColor ?? "var(--brand-primary, #9B8EC4)";
  const hasSelection = selectedValue !== undefined;

  const selectedIdx = hasSelection ? options.findIndex((o) => o.value === selectedValue) : -1;

  const fillPct = selectedIdx >= 0 ? (selectedIdx / Math.max(options.length - 1, 1)) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Scale track + circles */}
      <div className="relative px-2">
        {/* Background track */}
        <div
          className="pointer-events-none absolute left-7 right-7 top-[21px] h-[3px] rounded-full"
          style={{ backgroundColor: "#E8EDF8" }}
          aria-hidden="true"
        />

        {/* Filled track segment */}
        {hasSelection && (
          <div
            className="pointer-events-none absolute left-7 top-[21px] h-[3px] rounded-full"
            style={{
              width: `calc((100% - 56px) * ${fillPct / 100})`,
              background: `linear-gradient(90deg, ${color}, color-mix(in oklch, ${color} 80%, white))`,
              transition: "width 0.3s ease",
            }}
            aria-hidden="true"
          />
        )}

        {/* Option buttons */}
        <div className="relative z-10 flex items-start justify-between" role="radiogroup">
          {options.map((opt, i) => {
            const isSelected = selectedValue === opt.value;
            const isPassed = hasSelection && selectedIdx >= 0 && i <= selectedIdx;

            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={opt.label}
                onClick={() => onChange(opt.value)}
                className="likert-option group flex flex-1 cursor-pointer flex-col items-center gap-2 border-none bg-transparent outline-none"
                style={{
                  padding: "0 2px",
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                {/* Circle — spring-like transition from design reference */}
                <div
                  className="likert-circle flex shrink-0 items-center justify-center rounded-full"
                  style={{
                    width: isSelected ? 40 : 28,
                    height: isSelected ? 40 : 28,
                    background: isSelected
                      ? `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 80%, white))`
                      : "var(--card)",
                    border: isSelected
                      ? `3px solid ${color}`
                      : `2.5px solid ${isPassed ? `color-mix(in oklch, ${color} 40%, transparent)` : "#DDD7EE"}`,
                    boxShadow: isSelected
                      ? `0 4px 16px color-mix(in oklch, ${color} 30%, transparent)`
                      : "0 1px 4px rgba(0,0,0,0.04)",
                    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {isSelected ? (
                    <CheckCircle2 size={18} color="#FFFFFF" className="survey-check-pop" />
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#B3A8D4",
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-center leading-tight transition-colors"
                  style={{
                    fontSize: options.length > 6 ? 10 : 11.5,
                    fontWeight: isSelected ? 600 : i === 0 || i === options.length - 1 ? 500 : 400,
                    color: isSelected ? color : undefined,
                    maxWidth: options.length > 6 ? 48 : 64,
                    wordBreak: "break-word" as const,
                  }}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Endpoint labels */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#DDD7EE" }} />
          <span className="text-[11px] italic" style={{ color: "#718096" }}>
            {options[0]?.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] italic" style={{ color: "#718096" }}>
            {options[options.length - 1]?.label}
          </span>
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: `color-mix(in oklch, ${color} 40%, transparent)`,
            }}
          />
        </div>
      </div>
    </div>
  );
});
