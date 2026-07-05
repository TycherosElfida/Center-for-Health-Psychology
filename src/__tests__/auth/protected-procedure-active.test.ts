/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CHP Platform — protectedProcedure active-user guard (S-5 remediation)
 *
 * The audit (S-5) found that protectedProcedure verified a user still
 * EXISTS but never checked `isActive`. Auth.js sessions are JWT-strategy
 * with no server-side revocation, so a user deactivated via
 * adminUserAccounts.toggleUserActive kept full access until their JWT
 * expired (up to 30 days). This test drives profile.get (a
 * protectedProcedure) and asserts a deactivated user is rejected.
 *
 * Pattern mirrors save-progress-guard.test.ts: mock @/server/db so the
 * module imports without DATABASE_URL, hand-build a thenable ctx.db.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

import { profileRouter } from "@/server/trpc/procedures/profile";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function thenableChain(result: unknown) {
  const chain: any = {};
  for (const m of ["from", "where", "limit", "orderBy"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

function makeCaller(selectResults: unknown[]) {
  let call = 0;
  const db = {
    select: vi.fn(() => thenableChain(selectResults[call++])),
  };
  return profileRouter.createCaller({
    db,
    headers: new Headers(),
    resHeaders: new Headers(),
    session: { userId: USER_ID, role: "user" },
  } as any);
}

describe("protectedProcedure active-user guard (S-5)", () => {
  it("rejects a deactivated (isActive=false) user with UNAUTHORIZED", async () => {
    // 1st select = protectedProcedure user lookup; 2nd (empty) = body, only
    // reached if the guard fails to reject — which is exactly the bug.
    const caller = makeCaller([[{ id: USER_ID, isActive: false }], []]);
    await expect(caller.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects when the user no longer exists with UNAUTHORIZED", async () => {
    const caller = makeCaller([[]]);
    await expect(caller.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("allows an active user through to the procedure body", async () => {
    // 1st select = user lookup (active); 2nd select = profile.get body → no profile
    const caller = makeCaller([[{ id: USER_ID, isActive: true }], []]);
    await expect(caller.get()).resolves.toBeNull();
  });
});
