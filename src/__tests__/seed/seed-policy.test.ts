/**
 * CHP Platform — Seed Interpretation-Reseed Policy Tests (FH-3)
 *
 * The seed script purges + re-inserts result_interpretations on every
 * run, which bypasses the admin-layer band locks (scan finding N-5).
 * shouldReseedInterpretations is the pure decision gate wired into
 * seed.ts: tests with recorded sessions are frozen unless explicitly
 * overridden via SEED_FORCE_INTERPRETATIONS=true.
 *
 * The function lives in seed-policy.ts (NOT seed.ts) because seed.ts
 * executes main() at import time and connects to the database — test
 * code must never import it.
 */
import { describe, it, expect } from "vitest";
import { shouldReseedInterpretations } from "@/server/db/seed-policy";

describe("shouldReseedInterpretations (FH-3)", () => {
  it("1 — allows reseed when the test has no sessions", () => {
    expect(shouldReseedInterpretations(0, false)).toBe(true);
  });

  it("2 — skips reseed when the test has sessions (frozen)", () => {
    expect(shouldReseedInterpretations(1, false)).toBe(false);
    expect(shouldReseedInterpretations(66, false)).toBe(false);
  });

  it("3 — explicit force flag overrides the freeze", () => {
    expect(shouldReseedInterpretations(66, true)).toBe(true);
  });

  it("4 — force flag is a no-op when there are no sessions", () => {
    expect(shouldReseedInterpretations(0, true)).toBe(true);
  });
});
