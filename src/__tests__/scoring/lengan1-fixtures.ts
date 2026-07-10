/**
 * Lengan 1 — shared fixtures for the exhaustive coverage verification suite.
 *
 * Builds scoring-engine inputs from the repo's seed-source instrument data
 * (src/lib/data/questions.ts) and classifies scores against the seed-source
 * interpretation bands (src/lib/data/interpretations.ts).
 *
 * The seed-source files are the in-repo copy of the frozen DB configuration.
 * Parity with the live DB was verified at freeze time (FREEZE_RECORD.md §1–2;
 * docs/PROJECT_SCAN_FINDINGS.md §5 Q2–Q4). One known exception: the SRQ-29
 * seed items carry no `dimension` field — the domain tags exist only in the
 * DB — so `srq29Domain` overlays the DB-verified mapping here.
 *
 * `classify` mirrors the WHERE clause of `lookupInterpretation`
 * (src/server/scoring/interpretation.ts:29-41): dimension exact-match — or
 * (NULL | 'total') when omitted — AND minScore <= score AND maxScore >= score,
 * both bounds inclusive. The SQL itself cannot execute in this DB-free suite;
 * this helper is the documented in-memory equivalent of those conditions.
 */
import { QUESTIONS } from "@/lib/data/questions";
import { INTERPRETATIONS, type InterpretationSeed } from "@/lib/data/interpretations";
import type { ScoringInput } from "@/lib/types/assessment";

export type EngineQuestion = ScoringInput["questions"][number] & {
  options: { value: number }[];
};

/**
 * SRQ-29 domain mapping, 1-based item order → dimension key.
 * Source: live-DB dimension audit (PROJECT_SCAN_FINDINGS §5 Q3; re-verified in
 * FREEZE_RECORD §2): neurotic = items 1–20, substance = 21, psychotic = 22–24,
 * ptsd = 25–29.
 */
export function srq29Domain(order: number): string {
  if (order <= 20) return "neurotic";
  if (order === 21) return "substance";
  if (order <= 24) return "psychotic";
  return "ptsd";
}

/**
 * Engine-shaped questions for an instrument. Item order is 1-based seed-array
 * position (matches `questions.order` in the DB). Weight 1.00 and
 * required=true reflect the frozen DB config (scan Q15: all 65 questions
 * weight=1.00, required=true).
 */
export function engineQuestions(slug: "pss10" | "gpius2" | "srq29" | "srs"): EngineQuestion[] {
  const seed = QUESTIONS[slug];
  if (!seed) throw new Error(`lengan1-fixtures: unknown instrument slug "${slug}"`);
  return seed.map((q, i) => ({
    id: q.id,
    dimension: slug === "srq29" ? srq29Domain(i + 1) : (q.dimension ?? null),
    isReversed: q.reversed ?? false,
    weight: 1,
    options: q.options.map((o) => ({ value: o.value })),
  }));
}

function bounds(q: EngineQuestion): { lo: number; hi: number } {
  const values = q.options.map((o) => o.value);
  return { lo: Math.min(...values), hi: Math.max(...values) };
}

/**
 * Converts a desired post-reversal (scored) item value into the raw answer
 * that must be submitted to produce it. For reversed items this is the
 * self-inverse of the engine's reversal formula ((max − raw) + min); for
 * straight items raw = scored. The mapping itself is independently pinned by
 * the explicit reverseScore tests in each instrument file.
 */
export function rawForScored(q: EngineQuestion, scored: number): number {
  if (!q.isReversed) return scored;
  const { lo, hi } = bounds(q);
  return hi - scored + lo;
}

/** Answer map (question UUID → raw value) from a 1-based-order raw-value array. */
export function answersFromRaw(qs: EngineQuestion[], rawByOrder: number[]): Record<string, number> {
  if (rawByOrder.length !== qs.length) {
    throw new Error(`answersFromRaw: expected ${qs.length} values, got ${rawByOrder.length}`);
  }
  return Object.fromEntries(qs.map((q, i) => [q.id, rawByOrder[i]!]));
}

/** Answer map from a 1-based-order POST-REVERSAL (scored) value array. */
export function answersFromScored(
  qs: EngineQuestion[],
  scoredByOrder: number[]
): Record<string, number> {
  if (scoredByOrder.length !== qs.length) {
    throw new Error(`answersFromScored: expected ${qs.length} values, got ${scoredByOrder.length}`);
  }
  return Object.fromEntries(qs.map((q, i) => [q.id, rawForScored(q, scoredByOrder[i]!)]));
}

/**
 * Deterministic scored-value pattern whose post-reversal sum over the items of
 * `dimensions` equals `target` (pass null to target the instrument total).
 * All non-targeted items sit at their scale minimum. Greedy fill from the
 * first targeted item; throws if `target` is outside the achievable range.
 * The engine's own arithmetic re-verifies every pattern: tests always assert
 * computeScore's total/dimension score === target before classifying.
 */
export function scoredTargeting(
  qs: EngineQuestion[],
  dimensions: string[] | null,
  target: number
): number[] {
  const scored = qs.map((q) => bounds(q).lo);
  const targeted = qs
    .map((_, i) => i)
    .filter((i) => dimensions === null || dimensions.includes(qs[i]!.dimension ?? ""));
  let remaining = target - targeted.reduce((sum, i) => sum + scored[i]!, 0);
  if (remaining < 0) {
    throw new Error(`scoredTargeting: target ${target} below floor for ${dimensions ?? "total"}`);
  }
  for (const i of targeted) {
    const { lo, hi } = bounds(qs[i]!);
    const add = Math.min(hi - lo, remaining);
    scored[i] = lo + add;
    remaining -= add;
  }
  if (remaining !== 0) {
    throw new Error(`scoredTargeting: target ${target} above ceiling for ${dimensions ?? "total"}`);
  }
  return scored;
}

/**
 * All interpretation bands matching (slug, score, dimension) under
 * lookupInterpretation's semantics — see module header. Returns every match
 * so callers can also assert uniqueness (no overlapping bands).
 */
export function classify(slug: string, score: number, dimension?: string): InterpretationSeed[] {
  return INTERPRETATIONS.filter(
    (r) =>
      r.testSlug === slug &&
      (dimension ? r.dimension === dimension : r.dimension === null || r.dimension === "total") &&
      parseFloat(r.minScore) <= score &&
      parseFloat(r.maxScore) >= score
  );
}

/** `classify` asserting exactly one band matches; throws otherwise. */
export function classifyOne(slug: string, score: number, dimension?: string): InterpretationSeed {
  const matches = classify(slug, score, dimension);
  if (matches.length !== 1) {
    throw new Error(
      `classifyOne: expected exactly 1 band for ${slug}/${dimension ?? "total"} score ${score}, got ${matches.length}`
    );
  }
  return matches[0]!;
}
