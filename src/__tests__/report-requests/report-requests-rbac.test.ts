/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CHP Platform — Report-request mutation RBAC (S-4 remediation)
 *
 * The role model (src/server/trpc/index.ts) states psychiatrist and
 * researcher roles are READ-ONLY; write operations must go through
 * adminMutationProcedure (super_admin / admin only). The audit (S-4)
 * found four report-request mutations wired to plain adminProcedure,
 * letting read-only roles approve/reject/send reports.
 *
 * These tests drive the real reportRequestsRouter through its admin-auth
 * middleware (mocked so no JWT/DB is needed) and assert:
 *   - a "researcher" is FORBIDDEN on approve/reject/markReviewed/batchApprove
 *   - an "admin" passes the role guard (reaches the body → NOT_FOUND for a
 *     missing request), proving the guard is not over-restrictive.
 *
 * Role is read from the DB admin row inside adminProcedure, so the mocked
 * admin lookup's `role` is what the guard sees.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
// Keep react-pdf / resend out of the test graph entirely.
vi.mock("@/server/reports/send-report", () => ({ sendReportEmail: vi.fn() }));
vi.mock("@/server/reports/assemble", () => ({ assembleReportData: vi.fn() }));

const verifyAdminToken = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  getAdminTokenFromHeaders: vi.fn(() => "valid-token"),
  verifyAdminToken: (...args: unknown[]) => verifyAdminToken(...args),
  createAdminToken: vi.fn(async () => "refreshed-token"),
  setAdminCookie: vi.fn(),
}));

import { reportRequestsRouter } from "@/server/trpc/procedures/report-requests";

const ADMIN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REQUEST_ID = "99999999-9999-4999-8999-999999999999";

function thenableChain(result: unknown) {
  const chain: any = {};
  for (const m of ["from", "where", "limit", "orderBy", "set"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

/** selectResults are consumed in order: [0] = adminProcedure admin lookup. */
function makeCaller(role: string, selectResults: unknown[]) {
  verifyAdminToken.mockResolvedValue({
    adminId: ADMIN_ID,
    role,
    email: "person@chp.test",
    name: "Person",
    originalIat: Math.floor(Date.now() / 1000),
  });

  let call = 0;
  const adminRow = {
    id: ADMIN_ID,
    email: "person@chp.test",
    name: "Person",
    role, // ← the guard reads role from here
    isActive: true,
    sessionInvalidatedAt: null,
  };
  const results = [[adminRow], ...selectResults];

  const db = {
    select: vi.fn(() => thenableChain(results[call++])),
    update: vi.fn(() => thenableChain(undefined)),
  };

  return reportRequestsRouter.createCaller({
    db,
    headers: new Headers([["cookie", "admin-token=valid-token"]]),
    resHeaders: new Headers(),
    session: null,
  } as any);
}

beforeEach(() => verifyAdminToken.mockReset());

describe("report-request mutation RBAC (S-4)", () => {
  it("FORBIDs a researcher from approving", async () => {
    const caller = makeCaller("researcher", []);
    await expect(caller.approve({ requestId: REQUEST_ID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("FORBIDs a researcher from rejecting", async () => {
    const caller = makeCaller("researcher", []);
    await expect(caller.reject({ requestId: REQUEST_ID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("FORBIDs a researcher from marking reviewed", async () => {
    const caller = makeCaller("researcher", []);
    await expect(caller.markReviewed({ requestId: REQUEST_ID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("FORBIDs a psychiatrist from batch-approving", async () => {
    const caller = makeCaller("psychiatrist", []);
    await expect(caller.batchApprove({ requestIds: [REQUEST_ID] })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("lets an admin past the role guard (reaches body → NOT_FOUND)", async () => {
    // 2nd select = approve's request lookup → empty → NOT_FOUND (not FORBIDDEN)
    const caller = makeCaller("admin", [[]]);
    await expect(caller.approve({ requestId: REQUEST_ID })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
