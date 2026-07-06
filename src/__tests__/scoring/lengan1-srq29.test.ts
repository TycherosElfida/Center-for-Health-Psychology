/**
 * Lengan 1 — exhaustive coverage verification: SRQ-29 (Self-Reporting
 * Questionnaire, WHO 20-item core + Indonesian structural extension to 29).
 *
 * Characterizes the FROZEN scoring engine + configuration (FREEZE_RECORD.md,
 * commit fbcbac3); these tests must never drive changes into the engine.
 *
 * Ground truth:
 *   - 29 items, binary 0/1, NO reversed items, NO total/composite score (by
 *     design): WHO SRQ (Beusenberg & Orley 1994) + the Indonesian 29-item
 *     extension pattern.
 *   - Domains (live-DB audit, PROJECT_SCAN_FINDINGS §5 Q3; FREEZE_RECORD §2):
 *     neurotic {1–20} (0–20), substance {21} (0–1), psychotic {22–24} (0–3),
 *     ptsd {25–29} (0–5). NOTE: the seed-source questions.ts carries no
 *     dimension tags for SRQ-29 — the fixture overlays the DB-verified mapping
 *     (see lengan1-fixtures.srq29Domain).
 *   - Bands (scan Q4): neurotic 0–5 Normal / 6–20 flagged — ≥6 is the
 *     Kemenkes GME (Gangguan Mental Emosional) threshold, the single most
 *     important boundary in this instrument; psychotic 0 / ≥1; ptsd 0 / ≥1;
 *     substance 0 / 1. No total band exists (submitAssessment skips the
 *     total lookup by design, sessions.ts:365-382 — not reachable from a
 *     pure-function test, so the absence is asserted at config level here).
 *   - Specification-audit risk: LOW-MEDIUM.
 */
import { describe, it, expect } from "vitest";
import { computeScore } from "@/server/scoring/engine";
import { INTERPRETATIONS } from "@/lib/data/interpretations";
import {
  answersFromRaw,
  classify,
  classifyOne,
  engineQuestions,
  scoredTargeting,
} from "./lengan1-fixtures";

const qs = engineQuestions("srq29");
const ordersOf = (dim: string) => qs.flatMap((q, i) => (q.dimension === dim ? [i + 1] : []));
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe("SRQ-29 — frozen configuration structure (scan Q2/Q3; FREEZE_RECORD §2)", () => {
  it("has 29 items, zero reversed, binary 0/1 options on every item", () => {
    expect(qs).toHaveLength(29);
    expect(qs.filter((q) => q.isReversed)).toHaveLength(0);
    for (const q of qs) {
      expect(q.options.map((o) => o.value).sort((a, b) => a - b)).toEqual([0, 1]);
    }
  });

  it("domains: neurotic {1–20}, substance {21}, psychotic {22–24}, ptsd {25–29}", () => {
    expect(ordersOf("neurotic")).toEqual(range(1, 20));
    expect(ordersOf("substance")).toEqual([21]);
    expect(ordersOf("psychotic")).toEqual([22, 23, 24]);
    expect(ordersOf("ptsd")).toEqual([25, 26, 27, 28, 29]);
  });
});

describe("SRQ-29 — neurotic domain, GME threshold ≥6 (Kemenkes/Riskesdas; scan Q4)", () => {
  // Both sides of the 5→6 cutoff plus domain floor/ceiling. Other domains must
  // remain at 0 (no leakage between domains).
  it.each([
    [0, "low"],
    [5, "low"], // one below the GME threshold — still Normal
    [6, "high"], // AT the GME threshold — flagged
    [20, "high"],
  ])("neurotic score %i → severity %s, other domains stay 0", (target, severity) => {
    const answers = answersFromRaw(qs, scoredTargeting(qs, ["neurotic"], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores["neurotic"]).toBe(target);
    expect(result.dimensionScores["substance"]).toBe(0);
    expect(result.dimensionScores["psychotic"]).toBe(0);
    expect(result.dimensionScores["ptsd"]).toBe(0);
    expect(classifyOne("srq29", target, "neurotic").severity).toBe(severity);
  });

  it("anchor (explicit raw answers): exactly items 1–6 answered Yes → neurotic 6, flagged", () => {
    // 1×6 (items 1–6) + 0×23 — hand-checkable GME-threshold pattern.
    const raw = [1, 1, 1, 1, 1, 1, ...Array<number>(23).fill(0)];
    const result = computeScore({ answers: answersFromRaw(qs, raw), questions: qs });
    expect(result.dimensionScores["neurotic"]).toBe(6);
    const band = classifyOne("srq29", 6, "neurotic");
    expect(band.severity).toBe("high");
    expect(parseFloat(band.minScore)).toBe(6); // the flagged band starts exactly at 6
  });
});

describe("SRQ-29 — psychotic / ptsd / substance domains, 0→1 flag boundaries (scan Q4)", () => {
  it.each([
    ["psychotic", 0, "low"],
    ["psychotic", 1, "high"],
    ["psychotic", 3, "high"],
    ["ptsd", 0, "low"],
    ["ptsd", 1, "high"],
    ["ptsd", 5, "high"],
    ["substance", 0, "low"],
    ["substance", 1, "high"],
  ])("%s score %i → severity %s", (dim, target, severity) => {
    const answers = answersFromRaw(qs, scoredTargeting(qs, [dim], target));
    const result = computeScore({ answers, questions: qs });
    expect(result.dimensionScores[dim]).toBe(target);
    expect(classifyOne("srq29", target, dim).severity).toBe(severity);
  });
});

describe("SRQ-29 — no total/composite interpretation exists (by design, not an omission)", () => {
  it("the frozen band config has zero total-score rows for srq29", () => {
    const totalRows = INTERPRETATIONS.filter(
      (r) => r.testSlug === "srq29" && (r.dimension === null || r.dimension === "total")
    );
    expect(totalRows).toHaveLength(0);
  });

  it("total-score classification misses for every achievable sum 0–29", () => {
    // lookupInterpretation would return null (and fire a Sentry warning) for
    // any total-score lookup; submitAssessment never issues one for srq29
    // (sessions.ts:365-382 guard).
    for (let s = 0; s <= 29; s++) expect(classify("srq29", s), `total ${s}`).toHaveLength(0);
  });
});

describe("SRQ-29 — extremes", () => {
  it("all-0 → every domain 0, all bands Normal/low", () => {
    const result = computeScore({ answers: answersFromRaw(qs, Array(29).fill(0)), questions: qs });
    expect(result.totalScore).toBe(0);
    expect(result.dimensionScores).toEqual({ neurotic: 0, substance: 0, psychotic: 0, ptsd: 0 });
    for (const dim of ["neurotic", "substance", "psychotic", "ptsd"]) {
      const band = classifyOne("srq29", 0, dim);
      expect(band.severity, dim).toBe("low");
      expect(band.label, dim).toBe("Normal");
    }
  });

  it("all-1 → neurotic 20, substance 1, psychotic 3, ptsd 5 — fully flagged", () => {
    const result = computeScore({ answers: answersFromRaw(qs, Array(29).fill(1)), questions: qs });
    expect(result.dimensionScores).toEqual({ neurotic: 20, substance: 1, psychotic: 3, ptsd: 5 });
    expect(result.maxPossibleScore).toBe(29);
    expect(result.dimensionMaxScores).toEqual({
      neurotic: 20,
      substance: 1,
      psychotic: 3,
      ptsd: 5,
    });
    // The arithmetic sum exists in the engine output but carries no
    // interpretation for this instrument (asserted above).
    expect(result.totalScore).toBe(29);
    expect(classifyOne("srq29", 20, "neurotic").severity).toBe("high");
    expect(classifyOne("srq29", 1, "substance").severity).toBe("high");
    expect(classifyOne("srq29", 3, "psychotic").severity).toBe("high");
    expect(classifyOne("srq29", 5, "ptsd").severity).toBe("high");
  });
});

describe("SRQ-29 — band completeness sweep (no gaps/overlaps under lookup semantics)", () => {
  it("every integer domain score matches exactly one band (neurotic 0–20, psychotic 0–3, ptsd 0–5, substance 0–1)", () => {
    for (let s = 0; s <= 20; s++) {
      expect(classify("srq29", s, "neurotic"), `neurotic ${s}`).toHaveLength(1);
    }
    for (let s = 0; s <= 3; s++) {
      expect(classify("srq29", s, "psychotic"), `psychotic ${s}`).toHaveLength(1);
    }
    for (let s = 0; s <= 5; s++) expect(classify("srq29", s, "ptsd"), `ptsd ${s}`).toHaveLength(1);
    for (let s = 0; s <= 1; s++) {
      expect(classify("srq29", s, "substance"), `substance ${s}`).toHaveLength(1);
    }
  });
});
