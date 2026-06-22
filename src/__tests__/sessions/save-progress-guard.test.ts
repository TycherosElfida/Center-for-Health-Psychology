/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CHP Platform — saveProgress Freeze Guard Tests (FH-1)
 *
 * Behavioral tests for the answer-upsert guard in sessions.saveProgress:
 *   - Sessions that are no longer in_progress must reject writes
 *     (raw answers are frozen once a result exists — scan finding N-1).
 *   - Answers for questions that do not belong to the session's test
 *     must reject (foreign-question writes).
 *   - The in-progress happy path and the empty-payload short-circuit
 *     are unchanged.
 *
 * Pattern: vi.mock("@/server/db") (as in lookupInterpretation.test.ts)
 * so the procedure module can be imported without a live DATABASE_URL,
 * then call the real sessionsRouter via createCaller with a hand-built
 * mock ctx.db. No test touches the live database.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", () => ({
  db: {},
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

import { sessionsRouter } from "@/server/trpc/procedures/sessions";

// ── Fixtures ─────────────────────────────────────────────────────────

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const TEST_ID = "22222222-2222-4222-8222-222222222222";
const Q1 = "33333333-3333-4333-8333-333333333333";
const Q2 = "44444444-4444-4444-8444-444444444444";
const FOREIGN_Q = "55555555-5555-4555-8555-555555555555";

// ── Mock ctx.db ──────────────────────────────────────────────────────
//
// Thenable query-builder chain: every builder method returns the chain,
// and awaiting the chain (or calling .then) resolves the queued result.
// select() consumes queued results in call order:
//   1st select → test_sessions row lookup
//   2nd select → questions-of-test lookup

function thenableChain(result: unknown) {
  const chain: any = {};
  for (const m of ["from", "where", "limit", "orderBy"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

function makeMockDb(selectResults: unknown[]) {
  let call = 0;
  const insertChain: any = {};
  insertChain.values = vi.fn(() => insertChain);
  insertChain.onConflictDoUpdate = vi.fn(() => Promise.resolve());

  const db = {
    select: vi.fn(() => thenableChain(selectResults[call++])),
    insert: vi.fn(() => insertChain),
  };
  return { db, insertChain };
}

function makeCaller(db: unknown) {
  return sessionsRouter.createCaller({
    db,
    headers: new Headers(),
    resHeaders: new Headers(),
    session: null,
  } as any);
}

const inProgressSession = { id: SESSION_ID, testId: TEST_ID, status: "in_progress" };
const completedSession = { id: SESSION_ID, testId: TEST_ID, status: "completed" };

// ── Tests ────────────────────────────────────────────────────────────

describe("saveProgress freeze guard (FH-1)", () => {
  it("1 — rejects writes when the session is no longer in_progress", async () => {
    const { db } = makeMockDb([[completedSession]]);
    const caller = makeCaller(db);

    await expect(
      caller.saveProgress({ sessionId: SESSION_ID, answers: { [Q1]: 2 } })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("2 — rejects answers for questions that do not belong to the session's test", async () => {
    const { db } = makeMockDb([[inProgressSession], [{ id: Q1 }, { id: Q2 }]]);
    const caller = makeCaller(db);

    await expect(
      caller.saveProgress({ sessionId: SESSION_ID, answers: { [Q1]: 1, [FOREIGN_Q]: 3 } })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("3 — rejects when the session does not exist", async () => {
    const { db } = makeMockDb([[]]);
    const caller = makeCaller(db);

    await expect(
      caller.saveProgress({ sessionId: SESSION_ID, answers: { [Q1]: 1 } })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("4 — happy path unchanged: upserts answers for an in-progress session", async () => {
    const { db, insertChain } = makeMockDb([[inProgressSession], [{ id: Q1 }, { id: Q2 }]]);
    const caller = makeCaller(db);

    const result = await caller.saveProgress({
      sessionId: SESSION_ID,
      answers: { [Q1]: 1, [Q2]: 0 },
    });

    expect(result).toEqual({ success: true });
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith([
      { sessionId: SESSION_ID, questionId: Q1, value: 1 },
      { sessionId: SESSION_ID, questionId: Q2, value: 0 },
    ]);
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it("5 — empty answer map short-circuits without any DB access", async () => {
    const { db } = makeMockDb([]);
    const caller = makeCaller(db);

    const result = await caller.saveProgress({ sessionId: SESSION_ID, answers: {} });

    expect(result).toEqual({ success: true });
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
