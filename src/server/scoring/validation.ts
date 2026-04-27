/**
 * Scoring Validation — Pure input validation functions for the scoring pipeline.
 *
 * These run BEFORE computeScore() to ensure clinical-grade input correctness.
 * All functions are pure (no side effects, no DB access) for testability.
 */

/**
 * Validates that every answer value falls within the question's option bounds.
 * Extracts the numeric value from raw JSONB answer payloads (handles both
 * bare numbers and { selected: N } objects).
 */
export function validateAnswerValues(
  answers: Record<string, unknown>,
  questions: { id: string; options?: { value: number }[] }[]
): { valid: boolean; invalidQuestionIds: string[] } {
  const invalidQuestionIds: string[] = [];

  for (const q of questions) {
    if (!q.options || q.options.length === 0) continue;
    const raw = answers[q.id];
    if (raw === undefined || raw === null) continue; // completeness is checked separately

    // Extract numeric value from JSONB answer (same logic as engine.ts)
    const extracted =
      typeof raw === "object" && raw !== null && "selected" in raw
        ? (raw as Record<string, unknown>).selected
        : raw;

    const val = Number(extracted);

    if (Number.isNaN(val)) {
      invalidQuestionIds.push(q.id);
      continue;
    }

    const min = Math.min(...q.options.map((o) => o.value));
    const max = Math.max(...q.options.map((o) => o.value));
    if (val < min || val > max) {
      invalidQuestionIds.push(q.id);
    }
  }

  return { valid: invalidQuestionIds.length === 0, invalidQuestionIds };
}

/**
 * Validates that all required questions have been answered.
 * An answer is "present" if it is not undefined and not null.
 */
export function validateCompleteness(
  answers: Record<string, unknown>,
  questions: { id: string; required: boolean }[]
): { valid: boolean; missingQuestionIds: string[] } {
  const missingQuestionIds = questions
    .filter((q) => q.required && (answers[q.id] === undefined || answers[q.id] === null))
    .map((q) => q.id);

  return { valid: missingQuestionIds.length === 0, missingQuestionIds };
}
