/**
 * Test Metadata — Shared types and utilities for assessment instruments.
 *
 * MIGRATED: Data now comes from the database via tRPC `publicTests` procedures.
 * This module only contains shared types, category mappings, and pure utility
 * functions used by both server and client components.
 */

import type { ElementType } from "react";
import { Brain, ClipboardList, BarChart2, Monitor, ShieldCheck } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

/** Shape of test metadata as returned by publicTests tRPC procedures */
export interface TestMeta {
  /** URL slug used in routes: /test/[slug] */
  slug: string;
  /** Full instrument name, e.g. "Perceived Stress Scale (PSS-10)" */
  title: string;
  /** Abbreviated name shown on cards, e.g. "PSS-10" */
  abbreviation: string;
  /** Description text */
  description: string | null;
  /** Primary category for filtering */
  category: string;
  /** Original author(s) */
  author: string | null;
  /** Publication year */
  releaseYear: number | null;
  /** Thumbnail/illustration URL */
  thumbnailUrl: string | null;
  /** Brand color (hex) */
  color: string;
  /** Number of questions (derived from DB) */
  questionCount: number;
  /** Instructions text (only from getTestBySlug) */
  instructions?: string | null;
}

/* ═══════════════════════════════════════════════════════
   Category Icons — for filter chips in the catalog
   ═══════════════════════════════════════════════════════ */

export const CATEGORY_ICONS: Record<string, ElementType> = {
  All: ClipboardList,
  Personality: Brain,
  "Mental Health": ClipboardList,
  Stress: BarChart2,
  "Internet & Technology": Monitor,
  Resilience: ShieldCheck,
};

/* ═══════════════════════════════════════════════════════
   Default Category Colors — used as auto-suggest when
   creating new tests in admin portal
   ═══════════════════════════════════════════════════════ */

export const CATEGORY_COLOR_DEFAULTS: Record<string, string> = {
  "Mental Health": "#9B8EC4",
  Stress: "#6BA3BE",
  "Internet & Technology": "#D4A574",
  Resilience: "#7DB4A0",
};

/** Get suggested color for a category, falls back to brand purple */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLOR_DEFAULTS[category] ?? "#9B8EC4";
}

/* ═══════════════════════════════════════════════════════
   Sort Logic
   ═══════════════════════════════════════════════════════ */

export type SortBy = "name" | "items";

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "items", label: "Items" },
];

/** Pure function — safe for use on both server and client */
export function filterAndSortTests(
  tests: TestMeta[],
  searchQuery: string,
  activeCategory: string,
  sortBy: SortBy
): TestMeta[] {
  const q = searchQuery.toLowerCase();

  let items = tests.filter((t) => {
    const matchSearch =
      q === "" ||
      t.title.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false) ||
      t.category.toLowerCase().includes(q);
    const matchCategory = activeCategory === "All" || t.category === activeCategory;
    return matchSearch && matchCategory;
  });

  items = [...items].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.abbreviation.localeCompare(b.abbreviation);
      case "items":
        return b.questionCount - a.questionCount;
      default:
        return 0;
    }
  });

  return items;
}
