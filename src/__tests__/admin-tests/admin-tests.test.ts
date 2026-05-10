import { describe, it, expect, vi } from "vitest";

// Mock the trpc index to prevent loading DB/Auth (which crash in vitest due to next-auth)
vi.mock("../../../src/server/trpc/index", () => ({
  createTRPCRouter: vi.fn(),
  adminProcedure: { query: vi.fn(), input: () => ({ query: vi.fn() }) },
  adminMutationProcedure: { input: () => ({ mutation: vi.fn() }) }
}));

import {
  createTestSchema,
  updateTestSchema,
  getCategoriesSchema,
} from "../../../src/server/trpc/procedures/admin-tests";

describe("admin-tests.ts - 1D.9 Assessment Identity Fields", () => {
  const baseValidInput = {
    title: "Test",
    slug: "test-slug",
    category: "general",
    estimatedMinutes: 10,
    scoringMethod: "summative" as const,
  };

  it("1. createTest accepts valid input with abbreviation, author, releaseYear", () => {
    const result = createTestSchema.safeParse({
      ...baseValidInput,
      abbreviation: "AB",
      author: "Dr. Smith",
      releaseYear: 2025,
    });
    expect(result.success).toBe(true);
  });

  it("2. createTest rejects abbreviation under 2 chars", () => {
    const result = createTestSchema.safeParse({
      ...baseValidInput,
      abbreviation: "A", // length 1
    });
    expect(result.success).toBe(false);
  });

  it("3. createTest rejects abbreviation over 20 chars", () => {
    const result = createTestSchema.safeParse({
      ...baseValidInput,
      abbreviation: "A".repeat(21), // length 21
    });
    expect(result.success).toBe(false);
  });

  it("4. updateTest allows clearing author and releaseYear with null", () => {
    const result = updateTestSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      author: null,
      releaseYear: null,
    });
    expect(result.success).toBe(true);
  });

  it("5. getCategories schema accepts empty input (no params)", () => {
    const result = getCategoriesSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
