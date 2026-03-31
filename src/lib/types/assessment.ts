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
  }[];
}

export interface ScoringResult {
  totalScore: number;
  dimensionScores: Record<string, number>;
  rawScores: Record<string, unknown>;
  computedScores: Record<string, unknown>;
}
