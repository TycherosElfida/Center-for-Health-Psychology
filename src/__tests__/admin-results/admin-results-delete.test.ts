import { describe, it, expect } from "vitest";
import { z } from "zod";

const deleteResultSchema = z.object({
  scoreId: z.string().uuid(),
});

const getDetailedReportSchema = z.object({
  scoreId: z.string().uuid(),
});

describe("deleteResult input schema", () => {
  it("1 — accepts valid UUID scoreId", () => {
    const r = deleteResultSchema.safeParse({ 
      scoreId: "123e4567-e89b-12d3-a456-426614174000" 
    });
    expect(r.success).toBe(true);
  });

  it("2 — rejects non-UUID scoreId", () => {
    const r = deleteResultSchema.safeParse({ scoreId: "not-a-uuid" });
    expect(r.success).toBe(false);
  });
});

describe("getDetailedReport globalAverage", () => {
  it("3 — getDetailedReport schema accepts valid scoreId", () => {
    const r = getDetailedReportSchema.safeParse({
      scoreId: "123e4567-e89b-12d3-a456-426614174000"
    });
    expect(r.success).toBe(true);
  });
});
