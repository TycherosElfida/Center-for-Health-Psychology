"use client";

/**
 * useAssessmentSync — Headless state manager for assessment answers.
 *
 * Responsibilities:
 *   1. Own the AnswerMap via useReducer (referentially stable dispatch).
 *   2. Synchronously back up every change to localStorage (failsafe).
 *   3. Debounce a tRPC `sessions.saveProgress` mutation for server sync.
 *   4. Expose restore semantics for session resumption.
 *
 * The hook intentionally separates local (fast, synchronous) and remote
 * (slow, debounced) persistence so the UI never blocks on network I/O.
 */

import { useReducer, useEffect, useRef, useCallback } from "react";
import type { AnswerMap } from "@/lib/types/assessment";
import { trpc } from "@/lib/trpc/client";

/* ═══════════════════════════════════════════════════════════
   Reducer
   ═══════════════════════════════════════════════════════════ */

type AnswerAction =
  | { type: "SET"; questionId: string; value: unknown }
  | { type: "RESTORE"; answers: AnswerMap }
  | { type: "RESET" };

function answerReducer(state: AnswerMap, action: AnswerAction): AnswerMap {
  switch (action.type) {
    case "SET":
      if (state[action.questionId] === action.value) return state;
      return { ...state, [action.questionId]: action.value };
    case "RESTORE":
      return action.answers;
    case "RESET":
      return {};
  }
}

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

const SERVER_DEBOUNCE_MS = 1500; // 1.5s after last change → server push

function storageKey(sessionId: string) {
  return `chp_session_${sessionId}`;
}

/* ═══════════════════════════════════════════════════════════
   Hook
   ═══════════════════════════════════════════════════════════ */

interface UseAssessmentSyncOptions {
  /** Server-side debounce interval in ms. Default: 1500. */
  serverDebounceMs?: number;
  /** Disable server sync entirely (localStorage-only mode). */
  serverSyncEnabled?: boolean;
}

interface UseAssessmentSyncReturn {
  /** Current answer state. */
  answers: AnswerMap;
  /** Set a single answer. Stable reference — safe for dependency arrays. */
  setAnswer: (questionId: string, value: unknown) => void;
  /** Bulk-restore answers (e.g., from localStorage on mount). */
  restoreAnswers: (answers: AnswerMap) => void;
  /** Whether a server mutation is currently in-flight. */
  isSaving: boolean;
  /** Timestamp of last successful server save, or null. */
  lastSavedAt: Date | null;
}

export function useAssessmentSync(
  sessionId: string,
  initialAnswers: AnswerMap = {},
  options: UseAssessmentSyncOptions = {}
): UseAssessmentSyncReturn {
  const { serverDebounceMs = SERVER_DEBOUNCE_MS, serverSyncEnabled = true } = options;

  const [answers, dispatch] = useReducer(answerReducer, initialAnswers);

  // ── Stable callbacks ────────────────────────────────────
  const setAnswer = useCallback((questionId: string, value: unknown) => {
    dispatch({ type: "SET", questionId, value });
  }, []);

  const restoreAnswers = useCallback((restored: AnswerMap) => {
    dispatch({ type: "RESTORE", answers: restored });
  }, []);

  // ── Refs for debounce and save tracking ─────────────────
  const serverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedAtRef = useRef<Date | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // ── tRPC mutation ───────────────────────────────────────
  const saveMutation = trpc.sessions.saveProgress.useMutation({
    onSuccess: () => {
      lastSavedAtRef.current = new Date();
    },
    onError: (err) => {
      // Silent failure — localStorage is the safety net.
      // In production, this would feed into an error-reporting pipeline.
      console.warn("[useAssessmentSync] Server sync failed:", err.message);
    },
  });

  // ── localStorage: synchronous write on every change ─────
  useEffect(() => {
    if (!sessionId) return;

    const payload = JSON.stringify({
      answers,
      lastUpdated: Date.now(),
    });

    try {
      localStorage.setItem(storageKey(sessionId), payload);
    } catch {
      // QuotaExceededError — non-fatal, server sync is the backup.
      console.warn("[useAssessmentSync] localStorage write failed.");
    }
  }, [answers, sessionId]);

  // ── Server sync: debounced write ────────────────────────
  useEffect(() => {
    if (!serverSyncEnabled || !sessionId) return;

    // Clear any pending timer when answers change
    if (serverTimerRef.current) {
      clearTimeout(serverTimerRef.current);
    }

    const entryCount = Object.keys(answers).length;
    if (entryCount === 0) return; // Nothing to sync

    serverTimerRef.current = setTimeout(() => {
      saveMutation.mutate({
        sessionId,
        answers,
      });
    }, serverDebounceMs);

    return () => {
      if (serverTimerRef.current) {
        clearTimeout(serverTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, sessionId, serverSyncEnabled, serverDebounceMs]);

  // ── Cleanup: flush on unmount via fetch(keepalive) ───────
  // sendBeacon sends the body as an opaque Blob that bypasses tRPC's
  // internal deserialization. fetch+keepalive gives us full control
  // over Content-Type and body format so tRPC correctly parses the
  // payload through its standard mutation path.
  useEffect(() => {
    return () => {
      if (!serverSyncEnabled || !sessionId) return;

      const current = answersRef.current;
      const entryCount = Object.keys(current).length;
      if (entryCount === 0) return;

      // Best-effort final sync on tab close / navigation
      try {
        fetch("/api/trpc/sessions.saveProgress?batch=1", {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "0": {
              json: {
                sessionId,
                answers: current,
              },
            },
          }),
        }).catch(() => {
          // Silent failure — localStorage has the data.
        });
      } catch {
        // fetch not available or failed — localStorage has the data.
      }
    };
  }, [sessionId, serverSyncEnabled]);

  return {
    answers,
    setAnswer,
    restoreAnswers,
    isSaving: saveMutation.isPending,
    lastSavedAt: lastSavedAtRef.current,
  };
}

/* ═══════════════════════════════════════════════════════════
   Utility: Restore session from localStorage
   ═══════════════════════════════════════════════════════════ */

/**
 * Attempts to read a previously saved session from localStorage.
 * Returns the AnswerMap if found and valid, otherwise null.
 */
export function restoreSessionFromStorage(sessionId: string): AnswerMap | null {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { answers?: AnswerMap; lastUpdated?: number };
    if (parsed.answers && typeof parsed.answers === "object") {
      return parsed.answers;
    }
  } catch {
    // Corrupted data — discard silently.
  }
  return null;
}
