"use client";

/**
 * SubmitSection — Terminal card of the assessment.
 *
 * Renders a calming completion message and a prominent CTA.
 * The "Submit Assessment" button is strictly disabled until all
 * questions have been answered (isComplete === true).
 *
 * Touch target: the button is 48px tall minimum.
 */

import { CheckCircle2, Loader2, Send } from "lucide-react";

interface SubmitSectionProps {
  /** Whether every question has an answer. */
  isComplete: boolean;
  /** Whether the submit mutation is in-flight. */
  isSubmitting: boolean;
  /** Fires the submit mutation. */
  onSubmit: () => void;
  /** Brand color for the submit button. */
  accentColor?: string;
}

export function SubmitSection({
  isComplete,
  isSubmitting,
  onSubmit,
  accentColor,
}: SubmitSectionProps) {
  const color = accentColor ?? "var(--primary)";

  return (
    <section className="survey-fade-in mx-auto mt-8 max-w-2xl px-4 pb-16">
      <div
        className="rounded-2xl border p-8 text-center transition-all duration-300"
        style={{
          background: isComplete
            ? `linear-gradient(135deg, color-mix(in oklch, ${color} 6%, var(--card)), var(--card))`
            : "var(--card)",
          borderColor: isComplete
            ? `color-mix(in oklch, ${color} 25%, transparent)`
            : "var(--border)",
        }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: isComplete
              ? `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 75%, white))`
              : "var(--secondary)",
          }}
        >
          <CheckCircle2
            size={28}
            className={isComplete ? "text-white" : "text-muted-foreground/40"}
          />
        </div>

        {/* Message */}
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {isComplete
            ? "Thank you for completing this assessment"
            : "Please answer all questions to continue"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isComplete
            ? "Your responses are saved. When you are ready, submit to view your results."
            : "You can scroll back to review and change any of your previous answers."}
        </p>

        {/* CTA */}
        <button
          type="button"
          disabled={!isComplete || isSubmitting}
          onClick={onSubmit}
          className="mt-6 inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-xl px-8 font-heading text-[15px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background:
              isComplete && !isSubmitting
                ? `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 80%, white))`
                : "var(--secondary)",
            color: isComplete && !isSubmitting ? "white" : "var(--muted-foreground)",
            boxShadow:
              isComplete && !isSubmitting
                ? `0 6px 20px color-mix(in oklch, ${color} 25%, transparent)`
                : "none",
            transform: isComplete && !isSubmitting ? "translateY(0)" : undefined,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send size={16} />
              Submit Assessment
            </>
          )}
        </button>
      </div>
    </section>
  );
}
