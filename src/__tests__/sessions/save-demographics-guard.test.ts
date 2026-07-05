/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CHP Platform — saveDemographics Freeze Guard Tests (S-2 remediation)
 *
 * FH-1 froze raw answers once a session leaves in_progress, but the audit
 * (S-2) found saveDemographics had no equivalent guard: respondent PII
 * (name/sex/age/province/city) stayed mutable after submission via an
 * unauthenticated upsert keyed only on sessionId. That undermines the
 * study-freeze data-integrity claim (UNDERSTANDING_LOCK §3-4).
 *
 * This test asserts the same status guard as saveProgress:
 *   - completed session → PRECONDITION_FAILED, no write
 *   - missing session   → NOT_FOUND, no write
 *   - in_progress       → happy path, upsert runs
 *
 * Pattern mirrors save-progress-guard.test.ts.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

import { sessionsRouter } from "@/server/trpc/procedures/sessions";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const TEST_ID = "22222222-2222-4222-8222-222222222222";

const validInput = {
  sessionId: SESSION_ID,
  name: "Responden A",
  sex: "Male" as const,
  age: 21,
  province: "DKI Jakarta",
  city: "Jakarta Barat",
};

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

describe("saveDemographics freeze guard (S-2)", () => {
  it("1 — rejects writes when the session is no longer in_progress", async () => {
    const { db } = makeMockDb([[completedSession]]);
    const caller = makeCaller(db);

    await expect(caller.saveDemographics(validInput)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("2 — rejects when the session does not exist", async () => {
    const { db } = makeMockDb([[]]);
    const caller = makeCaller(db);

    await expect(caller.saveDemographics(validInput)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("3 — happy path unchanged: upserts demographics for an in-progress session", async () => {
    const { db, insertChain } = makeMockDb([[inProgressSession]]);
    const caller = makeCaller(db);

    const result = await caller.saveDemographics(validInput);

    expect(result).toEqual({ success: true });
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });
});
