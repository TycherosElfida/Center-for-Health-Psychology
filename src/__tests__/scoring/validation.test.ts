import { describe, it, expect } from "vitest";
import { validateAnswerValues, validateCompleteness } from "@/server/scoring/validation";

/* ═══════════════════════════════════════════════════════
   Answer Value Validation (T1A.1)
   ═══════════════════════════════════════════════════════ */

describe("validateAnswerValues", () => {
  const likert5 = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];
  const binary = [{ value: 0 }, { value: 1 }];
  const likert6 = [
    { value: 1 },
    { value: 2 },
    { value: 3 },
    { value: 4 },
    { value: 5 },
    { value: 6 },
  ];

  it("accepts valid Likert-5 values (0-4)", () => {
    const result = validateAnswerValues({ q1: 0, q2: 4, q3: 2 }, [
      { id: "q1", options: likert5 },
      { id: "q2", options: likert5 },
      { id: "q3", options: likert5 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.invalidQuestionIds).toEqual([]);
  });

  it("rejects value above max (999 on Likert-5)", () => {
    const result = validateAnswerValues({ q1: 999 }, [{ id: "q1", options: likert5 }]);
    expect(result.valid).toBe(false);
    expect(result.invalidQuestionIds).toEqual(["q1"]);
  });

  it("rejects negative value below min", () => {
    const result = validateAnswerValues({ q1: -1 }, [{ id: "q1", options: likert5 }]);
    expect(result.valid).toBe(false);
  });

  it("rejects non-binary value for binary questions", () => {
    const result = validateAnswerValues({ q1: 2 }, [{ id: "q1", options: binary }]);
    expect(result.valid).toBe(false);
  });

  it("accepts valid binary values (0 and 1)", () => {
    const result = validateAnswerValues({ q1: 0, q2: 1 }, [
      { id: "q1", options: binary },
      { id: "q2", options: binary },
    ]);
    expect(result.valid).toBe(true);
  });

  it("accepts valid Likert-6 values (1-6)", () => {
    const result = validateAnswerValues({ q1: 1, q2: 6 }, [
      { id: "q1", options: likert6 },
      { id: "q2", options: likert6 },
    ]);
    expect(result.valid).toBe(true);
  });

  it("rejects 0 on 1-based Likert-6 scale", () => {
    const result = validateAnswerValues({ q1: 0 }, [{ id: "q1", options: likert6 }]);
    expect(result.valid).toBe(false);
  });

  it("handles { selected: N } JSONB shape", () => {
    const result = validateAnswerValues({ q1: { selected: 3 } }, [{ id: "q1", options: likert5 }]);
    expect(result.valid).toBe(true);
  });

  it("rejects { selected: N } when N is out of bounds", () => {
    const result = validateAnswerValues({ q1: { selected: 99 } }, [{ id: "q1", options: likert5 }]);
    expect(result.valid).toBe(false);
  });

  it("rejects NaN answers (non-numeric string)", () => {
    const result = validateAnswerValues({ q1: "not-a-number" }, [{ id: "q1", options: likert5 }]);
    expect(result.valid).toBe(false);
  });

  it("skips questions with no options", () => {
    const result = validateAnswerValues(
      { q1: 999 },
      [{ id: "q1" }] // no options
    );
    expect(result.valid).toBe(true); // skipped, not invalid
  });

  it("skips unanswered questions (checked by completeness guard instead)", () => {
    const result = validateAnswerValues({}, [{ id: "q1", options: likert5 }]);
    expect(result.valid).toBe(true); // undefined answer is not invalid — it's "missing"
  });

  it("reports multiple invalid questions", () => {
    const result = validateAnswerValues({ q1: 999, q2: -5, q3: 2 }, [
      { id: "q1", options: likert5 },
      { id: "q2", options: likert5 },
      { id: "q3", options: likert5 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.invalidQuestionIds).toEqual(["q1", "q2"]);
  });
});

/* ═══════════════════════════════════════════════════════
   Answer Completeness Guard (T1A.2)
   ═══════════════════════════════════════════════════════ */

describe("validateCompleteness", () => {
  it("passes when all required questions answered", () => {
    const result = validateCompleteness({ q1: 1, q2: 2 }, [
      { id: "q1", required: true },
      { id: "q2", required: true },
    ]);
    expect(result.valid).toBe(true);
    expect(result.missingQuestionIds).toEqual([]);
  });

  it("fails when required question missing", () => {
    const result = validateCompleteness({ q1: 1 }, [
      { id: "q1", required: true },
      { id: "q2", required: true },
    ]);
    expect(result.valid).toBe(false);
    expect(result.missingQuestionIds).toEqual(["q2"]);
  });

  it("passes when optional question missing", () => {
    const result = validateCompleteness({ q1: 1 }, [
      { id: "q1", required: true },
      { id: "q2", required: false },
    ]);
    expect(result.valid).toBe(true);
  });

  it("treats null answer as missing", () => {
    const result = validateCompleteness({ q1: null }, [{ id: "q1", required: true }]);
    expect(result.valid).toBe(false);
  });

  it("accepts 0 as a valid answer (not missing)", () => {
    const result = validateCompleteness({ q1: 0 }, [{ id: "q1", required: true }]);
    expect(result.valid).toBe(true);
  });

  it("reports all missing questions", () => {
    const result = validateCompleteness({}, [
      { id: "q1", required: true },
      { id: "q2", required: true },
      { id: "q3", required: false },
    ]);
    expect(result.valid).toBe(false);
    expect(result.missingQuestionIds).toEqual(["q1", "q2"]);
  });
});
