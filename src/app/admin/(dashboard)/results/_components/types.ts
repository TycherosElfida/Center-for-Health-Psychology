/**
 * CHP Admin — Test Results types & design tokens
 *
 * Shared constants used across all sub-components of the Results page.
 * Design tokens pulled from the Figma design reference (TestResultsPage.tsx).
 */

/* ── Result row shape returned by adminResults.list ── */
export interface ResultRow {
  id: string;
  sessionId: string;
  name: string | null;
  sex: string | null;
  age: number | null;
  province: string | null;
  city: string | null;
  totalScore: number;
  resultLabel: string | null;
  createdAt: string; // ISO
}

/* ── Stats shape returned by adminResults.stats ── */
export interface ResultsStats {
  totalRecords: number;
  maleCount: number;
  femaleCount: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  scoreDistribution: Array<{ label: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
}

/* ── Filter state ── */
export interface FilterState {
  search: string;
  sex: "" | "Male" | "Female";
  province: string;
  city: string;
  ageMin: string;
  ageMax: string;
  scoreMin: string;
  scoreMax: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  sex: "",
  province: "",
  city: "",
  ageMin: "",
  ageMax: "",
  scoreMin: "",
  scoreMax: "",
  category: "",
  dateFrom: "",
  dateTo: "",
};

/* ── Sort types ── */
export type SortField = "name" | "sex" | "age" | "score" | "category" | "testDate";
export type SortDirection = "asc" | "desc";

/* ── Design tokens (from design reference) ── */
export const DT = {
  TEAL: "#9B8EC4",
  TEAL_DARK: "#6B5CA0",
  TEAL_LIGHT: "#EDE9F8",
  SAGE: "#B3A8D4",
  WHITE: "#FFFFFF",
  DARK_TEXT: "#1A202C",
  MID_TEXT: "#4A5568",
  LIGHT_TEXT: "#718096",
  BORDER: "#E2DCF0",
  BG_ALT: "#FBFAFD",
  BG_HEADER: "#F5F3FA",
  BG_CONTENT: "#FAFAFE",
  RED: "#E53E3E",
} as const;

/* ── Test-specific configuration ── */
export interface TestTabConfig {
  slug: string;
  shortName: string;
  color: string; // deep accent (text/icon)
  bg: string; // soft tint (button bg)
  maxScore: number;
}

export const TEST_TABS: TestTabConfig[] = [
  { slug: "srq29", shortName: "SRQ-29", color: "#9B8EC4", bg: "#EDE9F8", maxScore: 29 },
  { slug: "pss10", shortName: "PSS-10", color: "#6BA3BE", bg: "#E0EFF4", maxScore: 40 },
  { slug: "gpius2", shortName: "GPIUS-2", color: "#D4A574", bg: "#F7EBDC", maxScore: 75 },
  { slug: "srs", shortName: "SRS", color: "#7DB4A0", bg: "#E3EFE9", maxScore: 66 },
];

/* ── Category badge colors per test ── */
export const CATEGORY_COLORS: Record<string, Record<string, { bg: string; text: string }>> = {
  srq29: {
    Normal: { bg: "#E8F5E9", text: "#2E7D32" },
    Mild: { bg: "#FFF8E1", text: "#F57F17" },
    Moderate: { bg: "#FFF3E0", text: "#E65100" },
    Severe: { bg: "#FFEBEE", text: "#C62828" },
  },
  pss10: {
    "Low Stress": { bg: "#E8F5E9", text: "#2E7D32" },
    "Moderate Stress": { bg: "#FFF8E1", text: "#F57F17" },
    "High Stress": { bg: "#FFEBEE", text: "#C62828" },
  },
  gpius2: {
    "Normal Usage": { bg: "#E8F5E9", text: "#2E7D32" },
    "Mood Regulation": { bg: "#FFF8E1", text: "#F57F17" },
    "Deficient Self-Regulation": { bg: "#FFF3E0", text: "#E65100" },
    "Pref. Online Social Interaction": { bg: "#E3F2FD", text: "#1565C0" },
    "Compulsive Internet Use": { bg: "#FFEBEE", text: "#C62828" },
    "Negative Outcomes": { bg: "#FCE4EC", text: "#AD1457" },
  },
  srs: {
    "Low Resilience": { bg: "#FFEBEE", text: "#C62828" },
    "Moderate Resilience": { bg: "#FFF8E1", text: "#F57F17" },
    "High Resilience": { bg: "#E8F5E9", text: "#2E7D32" },
    "Very High Resilience": { bg: "#E0F2F1", text: "#00695C" },
  },
};

export const SEX_COLORS: Record<string, { bg: string; text: string }> = {
  Male: { bg: "#E3F2FD", text: "#1565C0" },
  Female: { bg: "#FCE4EC", text: "#AD1457" },
};
