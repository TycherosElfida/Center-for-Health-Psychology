/**
 * CHP Platform — Results Export Row Mapping Tests (FH-4)
 *
 * buildExportRows is the pure mapping behind downloadData (CSV/XLSX).
 * FH-4 adds per-dimension score columns so the expert manual-scoring
 * workflow no longer has to recompute subscales from raw items (scan
 * finding N-4): stable alphabetical "DIM {key}" columns placed after
 * Total/Category, blank cell when a result has no value for that key.
 */
import { describe, it, expect } from "vitest";
import { buildExportRows } from "@/app/admin/_components/exportUtils";

const QUESTION_HEADERS = [
  { order: 1, label: "Q1 - First question" },
  { order: 2, label: "Q2 - Second question" },
];

function makeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "r1",
    sessionId: "s1",
    name: "Responden A",
    sex: "Male",
    province: "DKI Jakarta",
    city: "Jakarta Barat",
    age: 21,
    totalScore: 25,
    resultLabel: "Stres Sedang",
    scoringVersion: 1,
    createdAt: "2026-06-01T00:00:00.000Z",
    itemAnswers: { 1: 2, 2: 3 },
    ...overrides,
  };
}

describe("buildExportRows (FH-4)", () => {
  it("1 — maps per-question answers into their header columns", () => {
    const [row] = buildExportRows([makeRow()], QUESTION_HEADERS);
    expect(row!["Q1 - First question"]).toBe(2);
    expect(row!["Q2 - Second question"]).toBe(3);
    expect(row!["Total (Computed)"]).toBe(25);
    expect(row!["Category"]).toBe("Stres Sedang");
  });

  it("2 — emits DIM columns as the alphabetical union across rows, after Total/Category", () => {
    const rows = buildExportRows(
      [
        makeRow({ dimensionScores: { POSI: 3, CP: 5 } }),
        makeRow({ id: "r2", dimensionScores: { DSR: 10 } }),
      ],
      QUESTION_HEADERS
    );

    const keys = Object.keys(rows[0]!);
    const start = keys.indexOf("Category") + 1;
    expect(keys.slice(start, start + 3)).toEqual(["DIM CP", "DIM DSR", "DIM POSI"]);
    expect(keys[start + 3]).toBe("Score Version");
  });

  it("3 — leaves a blank cell when a row has no value for a dimension key", () => {
    const rows = buildExportRows(
      [
        makeRow({ dimensionScores: { POSI: 3, CP: 5 } }),
        makeRow({ id: "r2", dimensionScores: { DSR: 10 } }),
      ],
      QUESTION_HEADERS
    );

    expect(rows[0]!["DIM CP"]).toBe(5);
    expect(rows[0]!["DIM POSI"]).toBe(3);
    expect(rows[0]!["DIM DSR"]).toBe("");
    expect(rows[1]!["DIM DSR"]).toBe(10);
    expect(rows[1]!["DIM CP"]).toBe("");
  });

  it("4 — emits no DIM columns when no row carries dimensionScores", () => {
    const [row] = buildExportRows([makeRow()], QUESTION_HEADERS);
    const dimKeys = Object.keys(row!).filter((k) => k.startsWith("DIM "));
    expect(dimKeys).toEqual([]);
  });
});
