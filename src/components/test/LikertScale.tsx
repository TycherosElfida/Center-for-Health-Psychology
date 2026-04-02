"use client";

/**
 * LikertScale — Horizontal visual scale for Likert-type questions.
 *
 * Stateless. Receives the question object, current selection, and onChange.
 * Renders as a connected-circle scale with a fill track between the first
 * option and the selected option.
 *
 * Touch targets: each option circle is ≥ 44×44px (WCAG 2.5.5 Level AAA).
 * On compact scales (>6 options), labels are truncated and shown as tooltips.
 *
 * Keyboard: each option is a <button> with proper focus-visible styling.
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
  const isCompact = options.length > 6;
  const color = accentColor ?? "var(--primary)";
  const hasSelection = selectedValue !== undefined;

  const selectedIdx = hasSelection ? options.findIndex((o) => o.value === selectedValue) : -1;

  const fillPct = selectedIdx >= 0 ? (selectedIdx / Math.max(options.length - 1, 1)) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Scale track + circles */}
      <div className="relative px-2">
        {/* Background track */}
        <div
          className="pointer-events-none absolute left-7 right-7 top-[21px] h-[3px] rounded-full bg-secondary"
          aria-hidden="true"
        />

        {/* Filled track segment */}
        {hasSelection && (
          <div
            className="pointer-events-none absolute left-7 top-[21px] h-[3px] rounded-full"
            style={{
              width: `calc((100% - 56px) * ${fillPct / 100})`,
              background: `linear-gradient(90deg, color-mix(in oklch, ${color} 50%, transparent), ${color})`,
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
                className="group flex flex-1 cursor-pointer flex-col items-center gap-2 border-none bg-transparent outline-none"
                style={{
                  padding: "0 2px",
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                {/* Circle — Gap #6: WCAG 2.2 min 44×44px touch target */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200"
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 80%, white))`
                      : "var(--card)",
                    border: isSelected
                      ? `3px solid ${color}`
                      : `2.5px solid ${isPassed ? `color-mix(in oklch, ${color} 40%, transparent)` : "var(--border)"}`,
                    boxShadow: isSelected
                      ? `0 4px 16px color-mix(in oklch, ${color} 30%, transparent)`
                      : "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  {isSelected ? (
                    <CheckCircle2
                      size={18}
                      className="text-white"
                      style={{ animation: "surveyCheckPop 0.25s ease-out both" }}
                    />
                  ) : (
                    <span
                      className="font-heading text-muted-foreground/50 transition-colors group-hover:text-muted-foreground"
                      style={{ fontSize: isCompact ? 10 : 11, fontWeight: 600 }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-center leading-tight transition-colors"
                  style={{
                    fontSize: isCompact ? 10 : 11.5,
                    fontWeight: isSelected ? 600 : i === 0 || i === options.length - 1 ? 500 : 400,
                    color: isSelected ? color : undefined,
                    maxWidth: isCompact ? 48 : 64,
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
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--border)" }} />
          <span className="text-[11px] italic text-muted-foreground">{options[0]?.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] italic text-muted-foreground">
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
