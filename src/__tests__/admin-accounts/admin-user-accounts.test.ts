/**
 * CHP Platform — Admin User Account Management Tests (1D.12)
 *
 * Test 1: listUsers input schema — paginated search
 * Test 2: toggleUserActive input schema — soft deactivate
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Replicate Zod schemas (RED phase) ────────────────────────────────

const listUsersSchema = z.object({
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

const toggleUserActiveSchema = z.object({
  userId: z.string().uuid(),
  active: z.boolean(),
});

// ── Tests ────────────────────────────────────────────────────────────

describe("listUsers input schema", () => {
  it("1 — accepts valid paginated input (search, page, limit)", () => {
    const result = listUsersSchema.safeParse({
      search: "john",
      page: 2,
      limit: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });
});

describe("toggleUserActive input schema", () => {
  it("2 — accepts valid input (userId UUID, active boolean)", () => {
    const result = toggleUserActiveSchema.safeParse({
      userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      active: false,
    });
    expect(result.success).toBe(true);
  });
});
