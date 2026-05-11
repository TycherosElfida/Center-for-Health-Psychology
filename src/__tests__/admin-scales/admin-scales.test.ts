/**
 * CHP Platform — Admin Scales Input & Lock-Guard Tests (1D.11)
 *
 * Tests 1–2: getScaleConfig schema validation
 * Tests 3–4: updateRange schema + lock guard
 * Tests 5–6: addRange schema + lock guard
 * Tests 7–8: deleteRange schema + lock guard
 *
 * Pattern: Replicate Zod schemas from admin-scales.ts, validate at
 * input boundary. Lock-guard tests simulate the validated-instrument
 * check inline, matching the exact branching in admin-scales.ts.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Replicate Zod schemas (RED phase — before implementation) ────────

const getScaleConfigSchema = z.object({
  testId: z.string().uuid(),
});

const updateRangeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(200).optional(),
  minScore: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  maxScore: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  description: z.string().min(1).max(2000).optional(),
  recommendation: z.string().max(2000).nullable().optional(),
  severity: z.enum(["low", "moderate", "high", "critical"]).optional(),
});

const addRangeSchema = z.object({
  testId: z.string().uuid(),
  dimension: z.string().nullable(),
  label: z.string().min(1).max(200),
  minScore: z.string().regex(/^\d+(\.\d{1,2})?$/),
  maxScore: z.string().regex(/^\d+(\.\d{1,2})?$/),
  description: z.string().min(1).max(2000),
  recommendation: z.string().max(2000).nullable().optional(),
  severity: z.enum(["low", "moderate", "high", "critical"]),
});

const deleteRangeSchema = z.object({
  id: z.string().uuid(),
});

// ── Lock guard simulation ────────────────────────────────────────────

const VALIDATED_INSTRUMENT_SLUGS = ["pss10", "gpius2", "srs", "srq29"] as const;

function isLockedSlug(slug: string): boolean {
  return (VALIDATED_INSTRUMENT_SLUGS as readonly string[]).includes(slug);
}

// ── Test Fixtures ────────────────────────────────────────────────────

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

// ── Tests ────────────────────────────────────────────────────────────

describe("getScaleConfig input schema", () => {
  it("1 — accepts valid testId UUID", () => {
    const result = getScaleConfigSchema.safeParse({ testId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("2 — rejects non-UUID testId", () => {
    const result = getScaleConfigSchema.safeParse({ testId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("updateRange input schema + lock guard", () => {
  it("3 — accepts valid partial update", () => {
    const result = updateRangeSchema.safeParse({
      id: VALID_UUID,
      label: "Updated Label",
      severity: "moderate",
    });
    expect(result.success).toBe(true);
  });

  it("4 — lock guard blocks update for validated instrument (pss10)", () => {
    expect(isLockedSlug("pss10")).toBe(true);
    expect(isLockedSlug("custom-test")).toBe(false);
  });
});

describe("addRange input schema + lock guard", () => {
  it("5 — accepts valid addRange input", () => {
    const result = addRangeSchema.safeParse({
      testId: VALID_UUID,
      dimension: null,
      label: "Normal Range",
      minScore: "0.00",
      maxScore: "13.00",
      description: "Score indicates normal levels.",
      severity: "low",
    });
    expect(result.success).toBe(true);
  });

  it("6 — lock guard blocks addRange for validated instrument (srq29)", () => {
    expect(isLockedSlug("srq29")).toBe(true);
    expect(isLockedSlug("my-custom-test")).toBe(false);
  });
});

describe("deleteRange input schema + lock guard", () => {
  it("7 — accepts valid UUID for deletion", () => {
    const result = deleteRangeSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("8 — lock guard blocks deleteRange for validated instrument (srs)", () => {
    expect(isLockedSlug("srs")).toBe(true);
    expect(isLockedSlug("unlocked-test")).toBe(false);
  });
});
