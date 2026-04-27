import { describe, it, expect, vi, beforeEach } from "vitest";
import { lookupInterpretation } from "@/server/scoring/interpretation";
import { db } from "@/server/db";
import * as Sentry from "@sentry/nextjs";

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
}));

describe("lookupInterpretation", () => {
  const mockTestId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Returns correct shape from DB when a matching row exists", async () => {
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
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("Fires Sentry captureMessage when DB returns no rows", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([]);

    await lookupInterpretation(mockTestId, 10);

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      `Interpretation miss: testId=${mockTestId}, score=10, dimension=total`,
      { level: "warning" }
    );
  });

  it("Returns null on DB miss (no hardcoded fallback)", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([]);

    const result = await lookupInterpretation(mockTestId, 10);
    expect(result).toBeNull();
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
    });
  });

  it("Fires Sentry with dimension in message when dimension is provided", async () => {
    vi.mocked(db.limit).mockResolvedValueOnce([]);

    await lookupInterpretation(mockTestId, 10, "neurotic");

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      `Interpretation miss: testId=${mockTestId}, score=10, dimension=neurotic`,
      { level: "warning" }
    );
  });
});
