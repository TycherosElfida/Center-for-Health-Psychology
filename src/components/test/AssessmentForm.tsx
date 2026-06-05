"use client";

/**
 * AssessmentForm — Client-side orchestrator for the assessment engine.
 *
 * Full state machine ported from DesignReference/TestPage.tsx:
 *   - CSS keyframe injection (surveyFadeIn, surveyPulse, surveyCheckPop, surveyShake)
 *   - Keyboard navigation (1–N / 1–0 for 10-point, ↑↓, j/k)
 *   - Scroll-focus system with questionRefs and auto-advance
 *   - Warning shake for unanswered questions
 *   - Opacity states: focused 1.0, answered 0.70, unanswered 0.45, locked 0.28
 *   - Scroll-focus system with questionRefs and auto-advance
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
   CSS Keyframe Injection (runs once on mount)
   ═══════════════════════════════════════════════════════ */

const SURVEY_STYLES = `
  @keyframes surveyFadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes surveyPulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.05); }
  }
  @keyframes surveyCheckPop {
    0%   { transform: scale(0); }
    60%  { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  @keyframes surveyShake {
    0%, 100% { transform: scale(1) translateX(0); }
    15%       { transform: scale(1) translateX(-7px); }
    35%       { transform: scale(1) translateX( 7px); }
    55%       { transform: scale(1) translateX(-4px); }
    75%       { transform: scale(1) translateX( 4px); }
  }
  .survey-fade-in  { animation: surveyFadeSlideIn 0.35s ease-out both; }
  .survey-pulse    { animation: surveyPulse 0.3s ease-out; }
  .survey-check-pop{ animation: surveyCheckPop 0.25s ease-out both; }
  .survey-shake    { animation: surveyShake 0.45s ease-out both; }
  .likert-option:hover .likert-circle {
    transform: scale(1.15);
    box-shadow: 0 0 0 4px rgba(155,142,196,0.15);
  }
  .likert-option:focus-visible {
    outline: 2px solid #9B8EC4;
    outline-offset: 2px;
    border-radius: 12px;
  }
  .binary-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(155,142,196,0.18) !important;
  }
  .binary-option:focus-visible {
    outline: 2px solid #9B8EC4;
    outline-offset: 2px;
  }
`;

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface AssessmentFormProps {
  testMeta: TestMeta;
  questions: Question[];
  sessionId: string;
  initialAnswers?: Record<string, unknown>;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function AssessmentForm({
  testMeta,
  questions,
  sessionId,
  initialAnswers,
}: AssessmentFormProps) {
  const router = useRouter();

  // ── Inject CSS keyframes once ────────────────────────
  useEffect(() => {
    const styleId = "survey-anim-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = SURVEY_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // ── Restore answers from localStorage on mount ──────────
  const restoredAnswers = useMemo(() => {
    if (typeof window === "undefined") return initialAnswers ?? {};
    const local = restoreSessionFromStorage(sessionId);
    if (!local) return initialAnswers ?? {};
    return { ...(initialAnswers ?? {}), ...local };
  }, [sessionId, initialAnswers]);

  // ── State + auto-save hook ──────────────────────────────
  const { answers, setAnswer, isSaving, flushToServer } = useAssessmentSync(
    sessionId,
    restoredAnswers
  );

  const [mounted, setMounted] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect -- SSR hydration guard; no alternative pre-React 19 */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Refs for scroll-focus state machine ─────────────────
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAutoScrolling = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const isRedirectingRef = useRef(false);

  // ── Derived state ───────────────────────────────────────
  const answeredCount = mounted ? Object.keys(answers).length : 0;
  const isComplete = mounted ? answeredCount === questions.length : false;
  // ── Focus tracking ──────────────────────────────────────
  const [focusedQ, setFocusedQ] = useState(0);
  const firstUnansweredIdx = mounted ? questions.findIndex((q) => answers[q.id] === undefined) : 0;

  // ── Warning shake state ─────────────────────────────────
  const [warningQIdx, setWarningQIdx] = useState<number | null>(null);
  const [warningShakeKey, setWarningShakeKey] = useState(0);

  function triggerWarning(idx: number) {
    setWarningQIdx(idx);
    setWarningShakeKey((k) => k + 1);
  }

  // ── Shake effect: remove + re-add class on warningShakeKey change
  useEffect(() => {
    if (warningQIdx === null) return;
    const el = questionRefs.current[warningQIdx];
    if (!el) return;

    el.classList.remove("survey-shake");
    // Force reflow
    void el.offsetWidth;
    el.classList.add("survey-shake");

    const timer = setTimeout(() => {
      el.classList.remove("survey-shake");
    }, 500);

    return () => clearTimeout(timer);
  }, [warningShakeKey, warningQIdx]);

  /* eslint-disable react-hooks/set-state-in-effect -- reactive clear: reset warning when flagged question gets answered */
  useEffect(() => {
    if (warningQIdx !== null) {
      const qId = questions[warningQIdx]?.id;
      if (qId && answers[qId] !== undefined) {
        setWarningQIdx(null);
      }
    }
  }, [answers, warningQIdx, questions]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Auto-clear warning after 4s
  useEffect(() => {
    if (warningQIdx === null) return;
    const timer = setTimeout(() => setWarningQIdx(null), 4000);
    return () => clearTimeout(timer);
  }, [warningShakeKey, warningQIdx]);

  // ── Keyboard hint ───────────────────────────────────────
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowKeyboardHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // ── Scroll-to-question ──────────────────────────────────
  const scrollToQuestion = useCallback((index: number) => {
    const el = questionRefs.current[index];
    if (!el) return;
    isAutoScrolling.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isAutoScrolling.current = false;
    }, 800);
  }, []);

  // ── Answer handler with auto-advance ────────────────────
  const handleAnswer = useCallback(
    (questionId: string, value: number, currentIdx: number) => {
      setAnswer(questionId, value);

      // Advance focus to next unanswered
      const currentAnswers = answersRef.current;
      const nextUnanswered = questions.findIndex(
        (q, i) => i > currentIdx && currentAnswers[q.id] === undefined && q.id !== questionId
      );
      if (nextUnanswered !== -1) {
        setFocusedQ(nextUnanswered);
        setTimeout(() => scrollToQuestion(nextUnanswered), 300);
      }
    },
    [setAnswer, questions, scrollToQuestion, setFocusedQ]
  );

  // ── Keyboard navigation ─────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentQ = questions[focusedQ];
      if (!currentQ) return;

      const opts = currentQ.options ?? [];
      const optionValues = opts.map((o) => o.value);
      const keyToValue = (key: string): number | null => {
        if (key === "0") return 10;
        const n = parseInt(key, 10);
        if (n >= 1 && n <= 9) return n;
        return null;
      };
      const value = keyToValue(e.key);
      if (value !== null && optionValues.includes(value)) {
        e.preventDefault();
        handleAnswer(currentQ.id, value, focusedQ);
      }

      // Arrow Down / J: advance focus
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIdx = focusedQ + 1;
        if (nextIdx < questions.length) {
          if (nextIdx <= firstUnansweredIdx + 1 || firstUnansweredIdx === -1) {
            setFocusedQ(nextIdx);
            scrollToQuestion(nextIdx);
          } else {
            triggerWarning(firstUnansweredIdx);
            scrollToQuestion(firstUnansweredIdx);
          }
        }
      }

      // Arrow Up / K: go back
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIdx = focusedQ - 1;
        if (prevIdx >= 0) {
          setFocusedQ(prevIdx);
          scrollToQuestion(prevIdx);
        }
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusedQ, firstUnansweredIdx, scrollToQuestion, questions, handleAnswer]);

  // ── Submit mutation ─────────────────────────────────────
  const submitMutation = trpc.sessions.submitAssessment.useMutation({
    onSuccess: (data) => {
      isRedirectingRef.current = true;
      router.push(`/results/${data.scoreId}`);
    },
    onError: (err) => {
      console.error("[AssessmentForm] Submit failed:", err.message);
    },
  });

  const focusedQuestion = questions[focusedQ];
  const keyboardHintText =
    focusedQuestion && focusedQuestion.options.length > 2
      ? (() => {
          const values = focusedQuestion.options.map((o) => o.value);
          const minVal = Math.min(...values);
          const maxVal = Math.max(...values);
          const startKey = String(minVal);
          const endKey = maxVal === 10 ? "0" : String(maxVal);
          return `💡 Gunakan tombol keyboard ${startKey}–${endKey} untuk memilih jawaban lebih cepat`;
        })()
      : null;

  const handleSubmit = useCallback(async () => {
    if (!isComplete || submitMutation.isPending) return;
    // Flush debounced answers to the server before submitting.
    // Without this, the 1.5s debounce may not have fired yet,
    // causing the server to see zero answers in the DB.
    try {
      await flushToServer();
    } catch {
      // Retry once after a short delay — transient network/Neon errors
      console.warn("[AssessmentForm] Flush failed, retrying in 500ms...");
      try {
        await new Promise((r) => setTimeout(r, 500));
        await flushToServer();
      } catch {
        // Both attempts failed — do NOT proceed to submit.
        // The DB has no answers, so submitAssessment will always fail.
        console.error("[AssessmentForm] Flush retry failed, cannot submit.");
        return;
      }
    }
    submitMutation.mutate({ sessionId });
  }, [isComplete, submitMutation, sessionId, flushToServer]);

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

      {/* Keyboard hint */}
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <AnimatePresence>
          {showKeyboardHint && keyboardHintText && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 rounded-xl bg-[var(--brand-primary-light,#EDE9F8)] px-4 py-2 text-center text-xs text-[var(--brand-primary,#9B8EC4)]"
            >
              {keyboardHintText}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-6">
          {questions.map((q, idx) => {
            const isAnswered = mounted ? answers[q.id] !== undefined : false;
            const selectedValue = mounted ? (answers[q.id] as number | undefined) : undefined;
            const isBinary = q.options.length === 2;
            const isFocused = idx === focusedQ;
            const isLocked = idx > firstUnansweredIdx && firstUnansweredIdx !== -1;

            // Per-card opacity states (from design reference)
            const cardOpacity = isFocused ? 1 : isAnswered ? 0.7 : isLocked ? 0.28 : 0.45;

            return (
              <div
                key={q.id}
                ref={(el) => {
                  questionRefs.current[idx] = el;
                }}
                className="survey-fade-in rounded-3xl border p-6 transition-all duration-300 cursor-pointer"
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
                onClick={() => {
                  if (isLocked) {
                    triggerWarning(firstUnansweredIdx);
                    return;
                  }
                  setFocusedQ(idx);
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
                    onChange={(val) => handleAnswer(q.id, val, idx)}
                    accentColor={testMeta.color}
                  />
                ) : (
                  <LikertScale
                    options={q.options}
                    selectedValue={selectedValue}
                    onChange={(val) => handleAnswer(q.id, val, idx)}
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
