/**
 * T0.4 — Seed interpretation data validation tests.
 *
 * Validates that the interpretation seed data is contiguous,
 * non-overlapping, and correctly typed before it reaches the DB.
 */
import { describe, it, expect } from "vitest";
import { INTERPRETATIONS, type InterpretationSeed } from "@/lib/data/interpretations";

// Helper: group interpretations by testSlug (for total-score instruments)
function groupBySlug(data: InterpretationSeed[]): Map<string, InterpretationSeed[]> {
  const map = new Map<string, InterpretationSeed[]>();
  for (const row of data) {
    const arr = map.get(row.testSlug) ?? [];
    arr.push(row);
    map.set(row.testSlug, arr);
  }
  return map;
}

// Helper: group interpretations by testSlug + dimension (for dimensional instruments)
function groupBySlugAndDimension(data: InterpretationSeed[]): Map<string, InterpretationSeed[]> {
  const map = new Map<string, InterpretationSeed[]>();
  for (const row of data) {
    const key = `${row.testSlug}::${row.dimension ?? "__total__"}`;
    const arr = map.get(key) ?? [];
    arr.push(row);
    map.set(key, arr);
  }
  return map;
}

// Helper: assert contiguity — each band's minScore must equal previous band's maxScore + 1
function assertContiguity(bands: InterpretationSeed[], testSlug: string): void {
  const sorted = [...bands].sort((a, b) => parseFloat(a.minScore) - parseFloat(b.minScore));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    const expectedMin = parseFloat(prev.maxScore) + 1;
    expect(
      parseFloat(curr.minScore),
      `${testSlug}: gap between band "${prev.label}" (max=${prev.maxScore}) and "${curr.label}" (min=${curr.minScore})`
    ).toBe(expectedMin);
  }
}

// Helper: assert non-overlap within a single instrument
function assertNonOverlap(bands: InterpretationSeed[], testSlug: string): void {
  const sorted = [...bands].sort((a, b) => parseFloat(a.minScore) - parseFloat(b.minScore));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    expect(
      parseFloat(curr.minScore),
      `${testSlug}: overlap between "${prev.label}" and "${curr.label}"`
    ).toBeGreaterThan(parseFloat(prev.maxScore));
  }
}

const VALID_SEVERITIES = ["low", "moderate", "high", "critical"] as const;

describe("Interpretation seed data validation", () => {
  const grouped = groupBySlug(INTERPRETATIONS);

  // ── Per-instrument contiguity (total-score rows only) ────────
  // Per-dimension rows (e.g. Helplessness 0-24, Self-Efficacy 0-16) have
  // their own score ranges and must NOT be included in the total-score
  // contiguity check — they are validated separately via groupBySlugAndDimension.
  it("PSS-10: total-score bands are contiguous with no gaps", () => {
    const bands = (grouped.get("pss10") ?? []).filter((r) => r.dimension === null);
    expect(bands.length).toBeGreaterThan(0);
    assertContiguity(bands, "pss10");
  });

  it("GPIUS-2: total-score bands are contiguous with no gaps", () => {
    const bands = (grouped.get("gpius2") ?? []).filter((r) => r.dimension === null);
    expect(bands.length).toBeGreaterThan(0);
    assertContiguity(bands, "gpius2");
  });

  it("SRS: total-score bands are contiguous with no gaps", () => {
    const bands = (grouped.get("srs") ?? []).filter((r) => r.dimension === null);
    expect(bands.length).toBeGreaterThan(0);
    assertContiguity(bands, "srs");
  });

  // ── Non-overlap across all instruments (dimension-aware) ────
  it("No score range overlaps within any instrument/dimension group", () => {
    const groupedByDim = groupBySlugAndDimension(INTERPRETATIONS);
    for (const [key, bands] of groupedByDim) {
      assertNonOverlap(bands, key);
    }
  });

  // ── Severity enum validity ───────────────────────────────────
  it("All severity values are valid enum members", () => {
    for (const row of INTERPRETATIONS) {
      expect(
        (VALID_SEVERITIES as readonly string[]).includes(row.severity),
        `Invalid severity "${row.severity}" for ${row.testSlug}/${row.label}`
      ).toBe(true);
    }
  });

  // ── SRS polarity assertion ───────────────────────────────────
  it("SRS: lowest score band has severity 'high' (inverted polarity)", () => {
    const srsBands = grouped.get("srs");
    expect(srsBands).toBeDefined();

    const sorted = [...srsBands!].sort((a, b) => parseFloat(a.minScore) - parseFloat(b.minScore));
    const lowestBand = sorted[0]!;
    expect(lowestBand.severity).toBe("high");

    const highestBand = sorted[sorted.length - 1]!;
    expect(highestBand.severity).toBe("low");
  });

  // ── Required fields non-empty ────────────────────────────────
  it("All rows have non-empty label, description, and severity", () => {
    for (const row of INTERPRETATIONS) {
      expect(row.label.trim().length, `Empty label for ${row.testSlug}`).toBeGreaterThan(0);
      expect(
        row.description.trim().length,
        `Empty description for ${row.testSlug}/${row.label}`
      ).toBeGreaterThan(0);
      expect(
        row.severity.trim().length,
        `Empty severity for ${row.testSlug}/${row.label}`
      ).toBeGreaterThan(0);
    }
  });
});

describe("SRQ-29 Dimensional Interpretations", () => {
  const srq29Rows = INTERPRETATIONS.filter((r) => r.testSlug === "srq29");
  const domains = ["neurotic", "substance", "psychotic", "ptsd"];

  it("Has exactly 8 interpretation rows (4 domains × 2 bands)", () => {
    expect(srq29Rows).toHaveLength(8);
  });

  it("Each domain has exactly 2 rows", () => {
    for (const domain of domains) {
      const rows = srq29Rows.filter((r) => r.dimension === domain);
      expect(rows).toHaveLength(2);
    }
  });

  it("All rows have non-null dimension field", () => {
    for (const row of srq29Rows) {
      expect(row.dimension).not.toBeNull();
    }
  });

  it("Neurotic domain: normal 0-5, flagged 6-20 (Kemenkes/Riskesdas ≥6 cutoff)", () => {
    const neurotic = srq29Rows.filter((r) => r.dimension === "neurotic");
    const normal = neurotic.find((r) => r.severity === "low")!;
    const flagged = neurotic.find((r) => r.severity === "high")!;
    expect(parseFloat(normal.minScore)).toBe(0);
    expect(parseFloat(normal.maxScore)).toBe(5);
    expect(parseFloat(flagged.minScore)).toBe(6);
    expect(parseFloat(flagged.maxScore)).toBe(20);
  });

  it("Substance domain: normal 0, flagged 1", () => {
    const substance = srq29Rows.filter((r) => r.dimension === "substance");
    const normal = substance.find((r) => r.severity === "low")!;
    const flagged = substance.find((r) => r.severity === "high")!;
    expect(parseFloat(normal.minScore)).toBe(0);
    expect(parseFloat(normal.maxScore)).toBe(0);
    expect(parseFloat(flagged.minScore)).toBe(1);
    expect(parseFloat(flagged.maxScore)).toBe(1);
  });

  it("Flagged bands all use severity 'high'", () => {
    const flaggedRows = srq29Rows.filter((r) => r.label !== "Normal");
    for (const row of flaggedRows) {
      expect(row.severity).toBe("high");
    }
  });
});
