/**
 * Admin Tests — Input Validation Guards (1D.7)
 *
 * Unit tests for the Zod input schemas used by admin test management
 * procedures. These validate guard logic at the input boundary:
 * slug format enforcement and scoring method enum constraint.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Replicate the exact Zod schemas from admin-tests.ts ──────────────

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens");

const createTestSchema = z.object({
  title: z.string().min(1).max(200),
  slug: slugSchema,
  description: z.string().max(1000).optional().default(""),
  category: z.string().min(1).max(100),
  estimatedMinutes: z.number().int().min(1).max(120),
  scoringMethod: z.enum(["summative", "dimensional", "binary_cluster"]),
  instructions: z.string().max(5000).optional().default(""),
  thumbnailUrl: z.string().url().max(500).or(z.literal("")).optional().default(""),
});

// ── Tests ────────────────────────────────────────────────────────────

describe("createTest input schema", () => {
  const validInput = {
    title: "Perceived Stress Scale",
    slug: "pss-10",
    category: "general",
    estimatedMinutes: 10,
    scoringMethod: "summative" as const,
  };

  it("rejects duplicate-style slug with uppercase characters", () => {
    const result = createTestSchema.safeParse({
      ...validInput,
      slug: "PSS-10",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid scoring method enum value", () => {
    const result = createTestSchema.safeParse({
      ...validInput,
      scoringMethod: "likert_average",
    });
    expect(result.success).toBe(false);
  });
});
