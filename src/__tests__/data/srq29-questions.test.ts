import { describe, it, expect } from "vitest";
import { QUESTIONS } from "@/lib/data/questions";

describe("SRQ-29 Question Data", () => {
  const srq29 = QUESTIONS.srq29;

  it("Contains exactly 29 questions", () => {
    expect(srq29).toHaveLength(29);
  });

  it("All questions use binary options (value 0 or 1 only)", () => {
    for (const q of srq29!) {
      const values = q.options.map((o) => o.value);
      expect(values.sort()).toEqual([0, 1]);
    }
  });

  it("No questions are marked as reversed", () => {
    for (const q of srq29!) {
      expect(q.reversed ?? false).toBe(false);
    }
  });

  it("Q1 text matches content spec (spot check)", () => {
    expect(srq29![0]!.text).toContain("sakit kepala");
  });

  it("Q17 text contains 'mengakhiri hidup' (suicidal ideation screening)", () => {
    expect(srq29![16]!.text).toContain("mengakhiri hidup");
  });

  it("Q21 text contains 'alkohol' or 'narkoba' (substance screening)", () => {
    const text = srq29![20]!.text;
    expect(text).toMatch(/alkohol|narkoba/);
  });

  it("All question IDs are unique", () => {
    const ids = srq29!.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
