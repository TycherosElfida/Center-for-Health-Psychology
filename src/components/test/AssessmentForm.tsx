"use client";

/**
 * AssessmentForm — Client-side orchestrator for the assessment engine.
 *
 * Wires together:
 *   - useAssessmentSync (state + auto-save)
 *   - AssessmentHeader (sticky top bar)
 *   - ProgressBar (progress indicator)
 *   - QuestionCard list (LikertScale / BinaryOptions per question)
 *   - SubmitSection (completion CTA)
 *
 * Focus tracking via IntersectionObserver: the currently visible question
 * card is highlighted while others are dimmed, reducing cognitive load.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { TestMeta } from "@/lib/data/tests";
import type { Question } from "@/lib/data/questions";
import { useAssessmentSync, restoreSessionFromStorage } from "@/hooks/useAssessmentSync";
import { trpc } from "@/lib/trpc/client";

import { AssessmentHeader } from "./AssessmentHeader";
import { ProgressBar } from "./ProgressBar";
import { LikertScale } from "./LikertScale";
import { BinaryOptions } from "./BinaryOptions";
import { SubmitSection } from "./SubmitSection";

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface AssessmentFormProps {
  testMeta: TestMeta;
  questions: Question[];
  sessionId: string;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function AssessmentForm({ testMeta, questions, sessionId }: AssessmentFormProps) {
  const router = useRouter();

  // ── Restore answers from localStorage on mount ──────────
  const restoredAnswers = useMemo(() => {
    if (typeof window === "undefined") return {};
    return restoreSessionFromStorage(sessionId) ?? {};
  }, [sessionId]);

  // ── State + auto-save hook ──────────────────────────────
  const { answers, setAnswer, isSaving } = useAssessmentSync(sessionId, restoredAnswers);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Derived state (cheap — max 29 questions) ────────────
  const answeredCount = mounted ? Object.keys(answers).length : 0;
  const isComplete = mounted ? answeredCount === questions.length : false;

  // ── Focus tracking via IntersectionObserver ──────────────
  const [focusedIdx, setFocusedIdx] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Keyboard hint (Gap #5) ──────────────────────────────
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowKeyboardHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Disconnect previous observer if any
    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio in viewport center
        let bestIdx = focusedIdx;
        let bestRatio = 0;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) {
              bestIdx = idx;
              bestRatio = entry.intersectionRatio;
            }
          }
        }

        if (bestRatio > 0) {
          setFocusedIdx(bestIdx);
        }
      },
      {
        // "Focus zone" — the middle 40% of the viewport
        rootMargin: "-30% 0px -30% 0px",
        threshold: [0.1, 0.3, 0.5, 0.7, 1.0],
      }
    );

    observerRef.current = observer;

    // Observe all card refs
    for (const ref of cardRefs.current) {
      if (ref) observer.observe(ref);
    }

    return () => observer.disconnect();
    // Re-run only when question count changes (not on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  // ── Answer handler — stable via useCallback ─────────────
  const handleAnswer = useCallback(
    (questionId: string, value: number) => {
      setAnswer(questionId, value);
    },
    [setAnswer]
  );

  // ── Submit mutation ─────────────────────────────────────
  const submitMutation = trpc.sessions.submitAssessment.useMutation({
    onSuccess: (data) => {
      router.push(`/results/${data.scoreId}`);
    },
    onError: (err) => {
      console.error("[AssessmentForm] Submit failed:", err.message);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!isComplete || submitMutation.isPending) return;
    submitMutation.mutate({ sessionId });
  }, [isComplete, submitMutation, sessionId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <AssessmentHeader testMeta={testMeta} isSaving={isSaving} />

      {/* Progress bar — sticky below header */}
      <div className="sticky top-14 z-40 border-b border-border/30 bg-background/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <ProgressBar
            current={answeredCount}
            total={questions.length}
            accentColor={testMeta.color}
          />
        </div>
      </div>

      {/* Keyboard hint — Gap #5 */}
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <AnimatePresence>
          {showKeyboardHint && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 rounded-xl bg-[var(--brand-primary-light,#EDE9F8)] px-4 py-2 text-center text-xs text-[var(--brand-primary,#9B8EC4)]"
            >
              💡 Gunakan tombol keyboard 1–5 untuk memilih jawaban lebih cepat
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-6">
          {questions.map((q, idx) => {
            const isFocused = idx === focusedIdx;
            const isAnswered = mounted ? answers[q.id] !== undefined : false;
            const selectedValue = mounted ? (answers[q.id] as number | undefined) : undefined;
            const isBinary = q.options.length === 2;

            /* Gap #4 — Opacity states:
               Active/focused: 1.0
               Answered but not focused: 0.70
               Unfocused, unanswered: 0.45 */
            const cardOpacity = isFocused ? 1 : isAnswered ? 0.7 : 0.45;

            return (
              <div
                key={q.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className="rounded-3xl border p-6 transition-all duration-300"
                style={{
                  opacity: cardOpacity,
                  transform: isFocused ? "scale(1)" : "scale(0.98)",
                  background: isAnswered
                    ? `linear-gradient(135deg, color-mix(in oklch, ${testMeta.color} 4%, var(--card)), var(--card))`
                    : "var(--card)",
                  borderColor: isFocused
                    ? `color-mix(in oklch, ${testMeta.color} 30%, var(--border))`
                    : "var(--border)",
                  boxShadow: isFocused
                    ? `0 4px 20px color-mix(in oklch, ${testMeta.color} 8%, transparent)`
                    : "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                {/* Question badge + text */}
                <div className="mb-5 flex items-start gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-heading text-xs font-bold text-white"
                    style={{
                      background: isAnswered ? testMeta.color : "var(--muted-foreground)",
                      opacity: isAnswered ? 1 : 0.4,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-foreground">{q.text}</p>
                </div>

                {/* Scale component */}
                {isBinary ? (
                  <BinaryOptions
                    options={q.options}
                    selectedValue={selectedValue}
                    onChange={(val) => handleAnswer(q.id, val)}
                    accentColor={testMeta.color}
                  />
                ) : (
                  <LikertScale
                    options={q.options}
                    selectedValue={selectedValue}
                    onChange={(val) => handleAnswer(q.id, val)}
                    accentColor={testMeta.color}
                  />
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Submit section */}
      <SubmitSection
        isComplete={isComplete}
        isSubmitting={submitMutation.isPending}
        onSubmit={handleSubmit}
        accentColor={testMeta.color}
      />
    </div>
  );
}
