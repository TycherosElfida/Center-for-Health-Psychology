import { z } from "zod";

export interface AnswerOption {
  label: string;
  value: number;
}

export interface Question {
  id: string; // The database uses UUIDs
  code: string;
  text: string;
  type: "LIKERT" | "MULTIPLE_CHOICE" | "TEXT" | "SLIDER";
  options?: AnswerOption[];
  min?: number;
  max?: number;
  required?: boolean;
}

export type AnswerMap = Record<string, unknown>; // questionId (UUID) -> JSONB value

export interface SessionState {
  answers: AnswerMap;
  lastUpdated: number;
}

export const startSessionSchema = z.object({
  testSlug: z.string().min(1),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: "You must accept the terms and consent to proceed.",
  }),
});

export const saveProgressSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.any()), // Map of question ID to answer payload
});

export const submitAssessmentSchema = z.object({
  sessionId: z.string().uuid(),
});

export type StartSessionPayload = z.infer<typeof startSessionSchema>;
export type SaveProgressPayload = z.infer<typeof saveProgressSchema>;
export type SubmitAssessmentPayload = z.infer<typeof submitAssessmentSchema>;

export interface ScoringInput {
  answers: AnswerMap;
  questions: {
    id: string;
    dimension: string | null;
    isReversed: boolean;
    weight: number;
    /** Option values for this question — required for reversed scoring (scale bounds). */
    options?: { value: number }[];
  }[];
}

export interface ScoringResult {
  totalScore: number;
  maxPossibleScore: number;
  /** Per-dimension maximum achievable scores. Keys match dimensionScores exactly.
   * For the DSR second-order rollup, DSR_max = CP_max + CU_max. */
  dimensionMaxScores: Record<string, number>;
  dimensionScores: Record<string, number>;
  rawScores: Record<string, unknown>;
  computedScores: Record<string, unknown>;
}

/* ═══════════════════════════════════════════════════════
   Score Interpretation (single source of truth)
   ═══════════════════════════════════════════════════════ */

export interface ScoreInterpretation {
  label: string;
  color: string;
  description: string;
  recommendation?: string | null;
  severity: "low" | "moderate" | "high" | "critical";
}

/** Maps severity levels to display colours for the results UI. */
export const SEVERITY_COLORS: Record<string, string> = {
  low: "#2ecc71",
  moderate: "#f39c12",
  high: "#e74c3c",
  critical: "#c0392b",
} as const;
