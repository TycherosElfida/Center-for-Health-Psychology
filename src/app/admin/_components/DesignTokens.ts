/**
 * Shared Design Tokens for CHP Admin Panel
 *
 * Extracted from DesignReference/AssessmentManagementPage.tsx palette.
 * Single source of truth — every admin component imports from here.
 *
 * Guidelines reference: DesignReference/Guidelines.md
 * Palette: TEAL #9B8EC4, TEAL_DARK #6B5CA0, TEAL_LIGHT #EDE9F8
 */
import type React from "react";

/* ── Palette ─────────────────────────────────────────────────── */
export const BRAND = "#9B8EC4";
export const BRAND_DEEP = "#6B5CA0";
export const BRAND_LIGHT = "#EDE9F8";
export const BRAND_BG = "#F5F3FA";

export const WHITE = "#FFFFFF";
export const DARK_TEXT = "#1A202C";
export const MID_TEXT = "#4A5568";
export const LIGHT_TEXT = "#718096";
export const BORDER = "#E2DCF0";

export const RED = "#E53E3E";
export const RED_LIGHT = "#FFF5F5";
export const RED_BORDER = "#FED7D7";

export const GREEN = "#2E7D32";
export const GREEN_LIGHT = "#E8F5E9";
export const GREEN_BORDER = "#A5D6A7";

export const YELLOW = "#D69E2E";
export const WARNING = "#E65100";
export const WARNING_BG = "#FFF3E0";
export const WARNING_BORDER = "#FFE0B2";

/* ── Status Badge Config ────────────────────────────────────── */
export const STATUS_CONFIG = {
  draft: { label: "Draft", bg: "#F0EDF5", color: BRAND_DEEP, border: "#D6CEE8" },
  published: { label: "Published", bg: GREEN_LIGHT, color: GREEN, border: GREEN_BORDER },
  archived: { label: "Archived", bg: "#F5F5F5", color: "#757575", border: "#E0E0E0" },
} as const;

/* ── Scoring Method Config ──────────────────────────────────── */
export const SCORING_LABELS: Record<string, string> = {
  summative: "Summative",
  dimensional: "Dimensional",
  binary_cluster: "Binary Cluster",
};

/* ── Shared Input Style ─────────────────────────────────────── */
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 14px",
  borderRadius: 10,
  border: `1.5px solid ${BORDER}`,
  background: WHITE,
  fontSize: 13,
  color: DARK_TEXT,
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  fontFamily: "'Inter', sans-serif",
};

/* ── Locked Input Style (structural lock active) ────────────── */
export const lockedInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: BRAND_BG,
  color: LIGHT_TEXT,
  cursor: "not-allowed",
};

/* ── Shared Label Style ─────────────────────────────────────── */
export const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  fontWeight: 700,
  color: MID_TEXT,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

/* ── Focus/Blur Handlers ────────────────────────────────────── */
export function onInputFocus(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  e.currentTarget.style.borderColor = BRAND;
  e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND}15`;
}

export function onInputBlur(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  e.currentTarget.style.borderColor = BORDER;
  e.currentTarget.style.boxShadow = "none";
}
