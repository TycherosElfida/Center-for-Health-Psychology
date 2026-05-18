import type { ScoringInput, ScoringResult } from "@/lib/types/assessment";

/**
 * Reverses a score within a given scale.
 *
 * Formula: reversedValue = (scaleMax - rawValue) + scaleMin
 *
 * This is scale-agnostic: works for Likert-5 (0–4), Likert-7 (0–6),
 * binary (0–1), or any future scale. Scale bounds are derived from the
 * question's option values.
 *
 * @throws {Error} If options array is empty (cannot determine scale bounds).
 */
export function reverseScore(rawValue: number, options: { value: number }[]): number {
  if (options.length === 0) {
    throw new Error("reverseScore: options array is empty — cannot determine scale bounds.");
  }

  const values = options.map((o) => o.value);
  const scaleMin = Math.min(...values);
  const scaleMax = Math.max(...values);

  return scaleMax - rawValue + scaleMin;
}

/**
 * Pure, deterministic functions that compute scores given raw answers and test metadata.
 */
export function computeScore(input: ScoringInput): ScoringResult {
  let totalScore = 0;
  let maxPossibleScore = 0;
  const dimensionScores: Record<string, number> = {};
  const perQuestionComputed: Record<string, number> = {};

  for (const q of input.questions) {
    const rawVal = input.answers[q.id];

    // For Likert or numeric slider responses, the value might simply be a number,
    const extractedVal =
      typeof rawVal === "object" && rawVal !== null && "selected" in rawVal
        ? (rawVal as Record<string, unknown>).selected
        : rawVal;

    // If val is not a valid number (e.g. string or undefined), default to 0
    const val = Number(extractedVal) || 0;

    // Apply reverse scoring before summation/weighting/dimensional grouping.
    // A question is reversed when questions.isReversed = true (DB-authoritative).
    let scoredVal = val;
    if (q.isReversed && q.options && q.options.length > 0) {
      scoredVal = reverseScore(val, q.options);
    }

    perQuestionComputed[q.id] = scoredVal;

    // NaN guard: if weight is NaN (e.g. empty string from DB), default to 1.0
    const safeWeight = Number.isNaN(q.weight) ? 1.0 : q.weight;
    const finalVal = scoredVal * safeWeight;

    // Accumulate theoretical maximum from option bounds
    if (q.options && q.options.length > 0) {
      const maxOptVal = Math.max(...q.options.map((o) => o.value));
      maxPossibleScore += maxOptVal * safeWeight;
    }

    totalScore += finalVal;

    if (q.dimension) {
      dimensionScores[q.dimension] = (dimensionScores[q.dimension] || 0) + finalVal;
    }
  }

  // ── Second-order rollup: Deficient Self-Regulation (DSR) ──────
  // Caplan (2010): DSR = Cognitive Preoccupation (CP) + Compulsive Use (CU).
  // Gate: only fires when BOTH CP and CU keys are present in dimensionScores,
  // which is exclusive to GPIUS-2. No instrument-specific slug check needed.
  if ("CP" in dimensionScores && "CU" in dimensionScores) {
    dimensionScores["DSR"] = (dimensionScores["CP"] ?? 0) + (dimensionScores["CU"] ?? 0);
  }

  return {
    totalScore,
    maxPossibleScore,
    dimensionScores,
    rawScores: input.answers,
    computedScores: {
      details: "Computed via deterministic summation algorithm",
      perQuestion: perQuestionComputed,
    },
  };
}
