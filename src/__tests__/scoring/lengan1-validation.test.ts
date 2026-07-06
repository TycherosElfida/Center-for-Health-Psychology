/**
 * Lengan 1 — exhaustive coverage verification: validateAnswerValues and
 * validateCompleteness across all four frozen instruments.
 *
 * Characterizes the FROZEN validation functions
 * (src/server/scoring/validation.ts) against the real configured option
 * ranges and item counts (live-DB audit PROJECT_SCAN_FINDINGS §5 Q2/Q15;
 * FREEZE_RECORD §1): PSS-10 10×[0–4], GPIUS-2 15×[1–5], SRQ-29 29×[0–1],
 * SRS 11×[1–6]; all items required.
 *
 * For each instrument: the min and max of the valid range must be ACCEPTED,
 * and the value one step outside each end must be REJECTED; a complete
 * answer set must pass completeness, and dropping exactly one required item
 * (first and last position) must fail it.
 */
import { describe, it, expect } from "vitest";
import { validateAnswerValues, validateCompleteness } from "@/server/scoring/validation";
import { answersFromRaw, engineQuestions } from "./lengan1-fixtures";

const INSTRUMENTS = [
  // [slug, item count, valid min, valid max]
  ["pss10", 10, 0, 4],
  ["gpius2", 15, 1, 5],
  ["srq29", 29, 0, 1],
  ["srs", 11, 1, 6],
] as const;

describe("validateAnswerValues — option-range boundaries per frozen instrument (scan Q2)", () => {
  describe.each(INSTRUMENTS)("%s (%i items, valid range %i–%i)", (slug, count, min, max) => {
    const qs = engineQuestions(slug);
    const required = qs.map((q) => ({ id: q.id, options: q.options }));

    it(`accepts a full answer set at the valid minimum (${min})`, () => {
      const result = validateAnswerValues(answersFromRaw(qs, Array(count).fill(min)), required);
      expect(result.valid).toBe(true);
      expect(result.invalidQuestionIds).toEqual([]);
    });

    it(`accepts a full answer set at the valid maximum (${max})`, () => {
      const result = validateAnswerValues(answersFromRaw(qs, Array(count).fill(max)), required);
      expect(result.valid).toBe(true);
      expect(result.invalidQuestionIds).toEqual([]);
    });

    it(`rejects ${min - 1} (one below the valid minimum)`, () => {
      const raw = Array(count).fill(min);
      raw[0] = min - 1;
      const result = validateAnswerValues(answersFromRaw(qs, raw), required);
      expect(result.valid).toBe(false);
      expect(result.invalidQuestionIds).toEqual([qs[0]!.id]);
    });

    it(`rejects ${max + 1} (one above the valid maximum)`, () => {
      const raw = Array(count).fill(min);
      raw[0] = max + 1;
      const result = validateAnswerValues(answersFromRaw(qs, raw), required);
      expect(result.valid).toBe(false);
      expect(result.invalidQuestionIds).toEqual([qs[0]!.id]);
    });
  });
});

describe("validateCompleteness — full vs one-missing answer sets per frozen instrument (scan Q15: all items required)", () => {
  describe.each(INSTRUMENTS)("%s (%i items)", (slug, count, min) => {
    const qs = engineQuestions(slug);
    const required = qs.map((q) => ({ id: q.id, required: true }));
    const fullAnswers = () => answersFromRaw(qs, Array(count).fill(min));

    it(`passes with all ${count} items answered`, () => {
      const result = validateCompleteness(fullAnswers(), required);
      expect(result.valid).toBe(true);
      expect(result.missingQuestionIds).toEqual([]);
    });

    it("fails when exactly the FIRST item is missing", () => {
      const answers = fullAnswers();
      delete answers[qs[0]!.id];
      const result = validateCompleteness(answers, required);
      expect(result.valid).toBe(false);
      expect(result.missingQuestionIds).toEqual([qs[0]!.id]);
    });

    it("fails when exactly the LAST item is missing", () => {
      const answers = fullAnswers();
      delete answers[qs[count - 1]!.id];
      const result = validateCompleteness(answers, required);
      expect(result.valid).toBe(false);
      expect(result.missingQuestionIds).toEqual([qs[count - 1]!.id]);
    });
  });
});
