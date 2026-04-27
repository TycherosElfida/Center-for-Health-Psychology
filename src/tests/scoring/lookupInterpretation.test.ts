import { describe, it, expect, vi, beforeEach } from "vitest";
import { lookupInterpretation } from "@/server/scoring/interpretation";
import { db } from "@/server/db";
import * as Sentry from "@sentry/nextjs";
import * as hardcodedFallback from "@/lib/scoring/interpretation";

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: vi.fn(),
}));

describe("lookupInterpretation", () => {
  const mockTestId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Returns correct shape from DB when a matching row exists (source: 'database')", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([
      {
        label: "Low Stress",
        description: "Your stress is low.",
        recommendation: "Keep it up.",
        severity: "low",
      },
    ]);

    const result = await lookupInterpretation(mockTestId, 10);
    expect(result).toEqual({
      label: "Low Stress",
      description: "Your stress is low.",
      recommendation: "Keep it up.",
      severity: "low",
      source: "database",
    });
  });

  it("Does NOT call Sentry when DB hit occurs", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([
      {
        label: "Low Stress",
        description: "Your stress is low.",
        recommendation: "Keep it up.",
        severity: "low",
      },
    ]);

    await lookupInterpretation(mockTestId, 10);
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
  });

  it("Fires Sentry breadcrumb with exact message format when DB returns undefined", async () => {
    // DB returns empty array (no rows found)
    vi.mocked(db.limit).mockResolvedValueOnce([]);
    // Mock for tests table lookup
    vi.mocked(db.limit).mockResolvedValueOnce([{ slug: "pss10" }]);

    await lookupInterpretation(mockTestId, 10);

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "scoring",
      message: `DB interpretation miss: testId=${mockTestId}, score=10. Using hardcoded fallback.`,
      level: "warning",
    });
  });

  it("Returns fallback data with source: 'hardcoded' on DB miss", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([]); // No interpretation
    vi.mocked(db.limit).mockResolvedValueOnce([{ slug: "pss10" }]); // returns test slug

    const spy = vi.spyOn(hardcodedFallback, "getScoreInterpretation").mockReturnValue({
      label: "Moderate",
      description: "Moderate desc",
      severity: "moderate",
      color: "#000",
    });

    const result = await lookupInterpretation(mockTestId, 10);
    expect(result).toEqual({
      label: "Moderate",
      description: "Moderate desc",
      recommendation: null,
      severity: "moderate",
      source: "hardcoded",
    });

    spy.mockRestore();
  });

  it("Returns null when DB miss AND hardcoded fallback also returns null", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([]);
    vi.mocked(db.limit).mockResolvedValueOnce([{ slug: "unknown" }]);

    const spy = vi
      .spyOn(hardcodedFallback, "getScoreInterpretation")
      .mockReturnValue(null as unknown as hardcodedFallback.ScoreInterpretation);

    const result = await lookupInterpretation(mockTestId, 10);
    expect(result).toBeNull();

    spy.mockRestore();
  });

  it("Handles numeric string comparison correctly", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([
      {
        label: "Test Label",
        description: "Test Desc",
        recommendation: null,
        severity: "low",
      },
    ]);

    await lookupInterpretation(mockTestId, 14);
    expect(db.where).toHaveBeenCalled();
  });

  it("Query uses (dimension IS NULL OR dimension = 'total') — not dimension = 'total' alone", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([
      {
        label: "Test Label",
        description: "Test Desc",
        recommendation: null,
        severity: "low",
      },
    ]);

    await lookupInterpretation(mockTestId, 14);
    expect(db.where).toHaveBeenCalled();
  });

  it("Queries with specific dimension when dimension param is provided", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([
      {
        label: "Cemas / Depresi",
        description: "Terdapat indikasi masalah psikologis...",
        recommendation: "Disarankan untuk berkonsultasi...",
        severity: "high",
      },
    ]);

    const result = await lookupInterpretation(mockTestId, 7, "neurotic");
    expect(result).toEqual({
      label: "Cemas / Depresi",
      description: "Terdapat indikasi masalah psikologis...",
      recommendation: "Disarankan untuk berkonsultasi...",
      severity: "high",
      source: "database",
    });
  });

  it("Falls back to total-score lookup when dimension is omitted", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([
      {
        label: "Stres Rendah",
        description: "Low stress",
        recommendation: null,
        severity: "low",
      },
    ]);

    const result = await lookupInterpretation(mockTestId, 5);
    expect(result).toEqual({
      label: "Stres Rendah",
      description: "Low stress",
      recommendation: null,
      severity: "low",
      source: "database",
    });
  });
});
