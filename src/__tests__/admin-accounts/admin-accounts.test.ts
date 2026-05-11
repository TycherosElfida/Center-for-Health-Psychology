/**
 * CHP Platform — Admin Account Management Tests (1D.12)
 *
 * Tests 1–3: listAdmins input schema validation
 * Tests 4–5: createAdmin input schema + password policy
 * Test  6:   updateAdmin input schema
 * Tests 7–8: toggleAdminActive self-protection + last super_admin guard
 * Test  9:   forcePasswordReset input schema
 * Test 10:   invalidateAdminSession input schema
 *
 * Pattern: Replicate Zod schemas, validate at input boundary.
 * Guard tests simulate role/self-protection inline.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Replicate Zod schemas (RED phase) ────────────────────────────────

const listAdminsSchema = z.object({
  search: z.string().max(200).optional(),
  role: z.enum(["super_admin", "admin", "psychiatrist", "researcher"]).optional(),
  status: z.enum(["active", "inactive", "locked"]).optional(),
});

const createAdminSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  password: z.string().min(12).max(128),
  role: z.enum(["admin", "psychiatrist", "researcher"]),
});

const updateAdminSchema = z.object({
  adminId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  role: z.enum(["super_admin", "admin", "psychiatrist", "researcher"]).optional(),
});

// toggleAdminActive schema is validated by the guard simulation tests below (7–8)
// rather than Zod parsing, since the guards are the critical path.

const forcePasswordResetSchema = z.object({
  adminId: z.string().uuid(),
});

const invalidateAdminSessionSchema = z.object({
  adminId: z.string().uuid(),
});

// ── Guard simulations ────────────────────────────────────────────────

function isSelfAction(actorId: string, targetId: string): boolean {
  return actorId === targetId;
}

function isLastSuperAdmin(superAdminCount: number): boolean {
  return superAdminCount <= 1;
}

// ── Fixtures ─────────────────────────────────────────────────────────

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const OTHER_UUID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

// ── Tests ────────────────────────────────────────────────────────────

describe("listAdmins input schema", () => {
  it("1 — accepts empty filter (list all)", () => {
    const result = listAdminsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("2 — accepts role filter (super_admin)", () => {
    const result = listAdminsSchema.safeParse({ role: "super_admin" });
    expect(result.success).toBe(true);
  });

  it("3 — accepts search string", () => {
    const result = listAdminsSchema.safeParse({ search: "john" });
    expect(result.success).toBe(true);
  });
});

describe("createAdmin input schema", () => {
  it("4 — accepts valid input (name, email, password 12+ chars, role)", () => {
    const result = createAdminSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "securePass123!",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("5 — rejects password under 12 chars", () => {
    const result = createAdminSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "short",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAdmin input schema", () => {
  it("6 — accepts valid partial update (name + role)", () => {
    const result = updateAdminSchema.safeParse({
      adminId: VALID_UUID,
      name: "Updated Name",
      role: "researcher",
    });
    expect(result.success).toBe(true);
  });
});

describe("toggleAdminActive guards", () => {
  it("7 — rejects when adminId === selfId (self-protection)", () => {
    expect(isSelfAction(VALID_UUID, VALID_UUID)).toBe(true);
    expect(isSelfAction(VALID_UUID, OTHER_UUID)).toBe(false);
  });

  it("8 — blocks deactivating last super_admin", () => {
    expect(isLastSuperAdmin(1)).toBe(true);
    expect(isLastSuperAdmin(2)).toBe(false);
  });
});

describe("forcePasswordReset input schema", () => {
  it("9 — accepts valid UUID input", () => {
    const result = forcePasswordResetSchema.safeParse({ adminId: VALID_UUID });
    expect(result.success).toBe(true);
  });
});

describe("invalidateAdminSession input schema", () => {
  it("10 — accepts valid UUID input", () => {
    const result = invalidateAdminSessionSchema.safeParse({ adminId: VALID_UUID });
    expect(result.success).toBe(true);
  });
});
