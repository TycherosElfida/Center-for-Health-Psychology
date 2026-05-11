/**
 * CHP Platform — Admin Audit Log Tests (1D.13)
 *
 * Tests 1–3: getAuditLog input schema validation
 *
 * Pattern: Replicate Zod schemas, validate at input boundary.
 * Read-only procedure — schema-only tests, no DB integration.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Replicate Zod schema (RED phase) ─────────────────────────────────

const getAuditLogSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  actorId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  quickFilter: z.enum(["24h", "week", "security", "mine"]).optional(),
});

// ── Tests ────────────────────────────────────────────────────────────

describe("getAuditLog input schema", () => {
  it("1 — accepts valid input with all optional filters", () => {
    const result = getAuditLogSchema.safeParse({
      page: 1,
      limit: 20,
      search: "pss",
      actorId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      action: "test.created",
      entityType: "test",
      from: "2026-05-01",
      to: "2026-05-07",
      quickFilter: "24h",
    });
    expect(result.success).toBe(true);
  });

  it("2 — rejects page < 1", () => {
    const result = getAuditLogSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("3 — rejects limit > 100", () => {
    const result = getAuditLogSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});
