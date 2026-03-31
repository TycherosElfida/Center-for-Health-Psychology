import type { ScoringInput, ScoringResult } from "@/lib/types/assessment";

/**
 * Pure, deterministic functions that compute scores given raw answers and test metadata.
 */
export function computeScore(input: ScoringInput): ScoringResult {
  let totalScore = 0;
  const dimensionScores: Record<string, number> = {};

  for (const q of input.questions) {
    const rawVal = input.answers[q.id];

    // For Likert or numeric slider responses, the value might simply be a number,
    // or it might be stored as an object { selected: 3 }
    let val = typeof rawVal === "object" && rawVal !== null ? rawVal.selected : rawVal;

    // If val is not a valid number (e.g. string or undefined), default to 0
    val = Number(val) || 0;

    const finalVal = val * q.weight;

    // A primitive reverse scoring approach: if isReversed, we logically need scale boundaries.
    // Without specific scale boundaries (min/max), we do not mathematically reverse
    // the generic value at this layer. For a completely abstracted scoring engine,
    // reversal logic requires knowing the option max boundaries or pre-configuring
    // it in the database `scoringRules` configuration.
    // For current iteration: we compute deterministic direct mapping.

    totalScore += finalVal;

    if (q.dimension) {
      dimensionScores[q.dimension] = (dimensionScores[q.dimension] || 0) + finalVal;
    }
  }

  return {
    totalScore,
    dimensionScores,
    rawScores: input.answers,
    computedScores: {
      details: "Computed via deterministic summation algorithm",
    },
  };
}
