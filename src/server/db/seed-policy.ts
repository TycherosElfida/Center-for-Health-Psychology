/**
 * CHP Platform — Seed Freeze Policy (FH-3)
 *
 * Pure decision logic for the seed script, extracted from seed.ts so it
 * is unit-testable: seed.ts executes main() at import time and connects
 * to the database, so tests must never import it.
 */

/**
 * Decides whether seed.ts may purge + re-insert the result_interpretations
 * rows of a test.
 *
 * A test with recorded sessions is frozen: its interpretation bands are
 * part of the configuration that existing results were scored against,
 * so a routine seed run must not touch them (scan finding N-5). The
 * freeze can only be lifted explicitly via SEED_FORCE_INTERPRETATIONS=true.
 *
 * @param sessionCount - Number of test_sessions rows for the test.
 * @param force - True when SEED_FORCE_INTERPRETATIONS=true was set.
 */
export function shouldReseedInterpretations(sessionCount: number, force: boolean): boolean {
  if (sessionCount <= 0) return true;
  return force;
}
