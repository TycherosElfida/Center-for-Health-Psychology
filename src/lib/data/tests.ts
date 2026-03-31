/**
 * Test Metadata — Single source of truth for all assessment instruments.
 *
 * This module is intentionally a plain TS file (no "use client" / "use server")
 * so it can be imported by both server and client components without boundary
 * violations.  Heavy question data lives in a separate module (questions.ts)
 * and is lazy-loaded only by the assessment engine.
 */

import type { ElementType } from "react";
import {
  Brain,
  ClipboardList,
  BarChart2,
  Monitor,
  ShieldCheck,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export type TestStatus = "Active" | "Draft" | "Beta";

export interface TestMeta {
  /** Unique slug used in URLs: /test/[testId] */
  id: string;
  /** Full instrument name, e.g. "Perceived Stress Scale (PSS-10)" */
  name: string;
  /** Abbreviated name shown on cards */
  shortName: string;
  /** One-liner for previews */
  description: string;
  /** Extended description shown in list view */
  longDescription: string;
  /** Number of items/questions */
  itemCount: number;
  /** Human-readable duration, e.g. "5–8 min" */
  duration: string;
  /** Brand color (hex) */
  color: string;
  /** Key into ICON_MAP */
  iconName: string;
  /** Subscale / dimension labels */
  categories: string[];
  /** Maximum achievable raw score */
  maxScore?: number;

  /* ── Extended metadata for the catalog page ── */
  primaryCategory: string;
  tags: string[];
  /** Cronbach's alpha reliability coefficient */
  alpha?: string;
  /** Original author(s) */
  author?: string;
  /** Publication year */
  year?: number;
  /** Short validation note */
  validationNote?: string;
  /** Approximate respondent count for social proof */
  respondentCount?: number;
  /** Publication status */
  status: TestStatus;
}

/* ═══════════════════════════════════════════════════════
   Icon Map
   ═══════════════════════════════════════════════════════ */

export const ICON_MAP: Record<string, ElementType> = {
  Brain,
  ClipboardList,
  BarChart2,
  Monitor,
  ShieldCheck,
};

/* ═══════════════════════════════════════════════════════
   Status Styles
   ═══════════════════════════════════════════════════════ */

export const STATUS_STYLES: Record<
  TestStatus,
  { bg: string; text: string; border: string }
> = {
  Active: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  Draft: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  Beta: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
};

/* ═══════════════════════════════════════════════════════
   Test Catalogue
   ═══════════════════════════════════════════════════════ */

export const TESTS: TestMeta[] = [
  {
    id: "mbti",
    name: "Myers–Briggs Type Indicator (MBTI)",
    shortName: "MBTI",
    description:
      "Widely used in personal development, career counseling, education, and organizational settings.",
    longDescription:
      "The Myers-Briggs Type Indicator (MBTI) is one of the world's most widely used personality assessments. It categorizes people into 16 distinct personality types based on four dichotomies: Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, and Judging/Perceiving.",
    itemCount: 12,
    duration: "10–15 min",
    color: "#8BA3D4",
    iconName: "Brain",
    categories: ["E/I", "S/N", "T/F", "J/P"],
    primaryCategory: "Personality",
    tags: ["Personality", "Cognitive", "Self-Discovery"],
    alpha: "0.82",
    author: "Myers & Briggs",
    year: 1962,
    validationNote:
      "Validated across 50+ countries with millions of respondents",
    respondentCount: 1247,
    status: "Active",
  },
  {
    id: "srq29",
    name: "Self-Reporting Questionnaire (SRQ-29)",
    shortName: "SRQ-29",
    description:
      "Widely used in public health research, primary healthcare services, and mental health monitoring programs.",
    longDescription:
      "The Self-Reporting Questionnaire (SRQ-29) is a World Health Organization screening instrument used to identify common mental disorders. It covers somatic symptoms, anxiety, depressive symptoms, and more.",
    itemCount: 10,
    duration: "5–8 min",
    color: "#9B8EC4",
    iconName: "ClipboardList",
    categories: ["Somatic", "Anxiety", "Depression", "Psychosis"],
    primaryCategory: "Mental Health",
    tags: ["Mental Health", "Screening", "WHO"],
    alpha: "0.85",
    author: "WHO",
    year: 1994,
    validationNote:
      "WHO-endorsed screening instrument for primary care settings",
    respondentCount: 892,
    status: "Active",
  },
  {
    id: "pss10",
    name: "Perceived Stress Scale (PSS-10)",
    shortName: "PSS-10",
    description:
      "Commonly used in psychological research, health studies, and clinical settings.",
    longDescription:
      "The Perceived Stress Scale (PSS-10) is the most widely used psychological instrument for measuring the perception of stress. It assesses the degree to which situations in one's life are appraised as stressful.",
    itemCount: 10,
    duration: "5–7 min",
    color: "#6BA3BE",
    iconName: "BarChart2",
    categories: ["Perceived Stress", "Coping"],
    primaryCategory: "Stress",
    tags: ["Stress", "Coping", "Wellbeing"],
    alpha: "0.89",
    author: "Cohen et al.",
    year: 1983,
    validationNote:
      "Gold-standard stress measurement instrument with 40+ years of validation",
    respondentCount: 1563,
    status: "Active",
  },
  {
    id: "gpius2",
    name: "Generalized Problematic Internet Use Scale 2 (GPIUS-2)",
    shortName: "GPIUS-2",
    description:
      "Designed to measure PIU for clinical purposes, educational assessment, and digital wellness research.",
    longDescription:
      "The Generalized Problematic Internet Use Scale 2 (GPIUS-2) is a 15-item cognitive-behavioral assessment measuring maladaptive cognitions and behaviors associated with problematic internet use across five subscales.",
    itemCount: 15,
    duration: "8–12 min",
    color: "#D4A574",
    iconName: "Monitor",
    categories: [
      "POSI",
      "Mood Regulation",
      "Cognitive Preoccupation",
      "Compulsive Use",
      "Negative Outcomes",
    ],
    maxScore: 75,
    primaryCategory: "Internet & Technology",
    tags: ["Internet", "Digital Wellness", "Behavioral"],
    alpha: "0.91",
    author: "Caplan",
    year: 2010,
    validationNote:
      "Indonesian adaptation validated with 420+ university students",
    respondentCount: 734,
    status: "Active",
  },
  {
    id: "srs",
    name: "Self-Regulation Scale (SRS)",
    shortName: "SRS",
    description:
      "Used in positive psychology, health behavior, academic motivation, and self-management programs.",
    longDescription:
      "The Self-Regulation Scale (SRS) measures an individual's capacity for self-regulation across three dimensions: self-efficacy, satisfaction, and perceived control. Higher scores indicate greater self-regulatory capacity.",
    itemCount: 11,
    duration: "5–8 min",
    color: "#7DB4A0",
    iconName: "ShieldCheck",
    categories: ["Self-Efficacy", "Satisfaction", "Perceived Control"],
    maxScore: 66,
    primaryCategory: "Resilience",
    tags: ["Resilience", "Self-Regulation", "Motivation"],
    alpha: "0.87",
    author: "Schwarzer et al.",
    year: 1999,
    validationNote:
      "Cross-culturally validated in 20+ countries for health research",
    respondentCount: 621,
    status: "Active",
  },
];

/* ═══════════════════════════════════════════════════════
   Derived Constants
   ═══════════════════════════════════════════════════════ */

/** Unique primary categories, prefixed with "All" for filter UI */
export const ALL_CATEGORIES = [
  "All",
  ...Array.from(new Set(TESTS.map((t) => t.primaryCategory))),
] as const;

/** Category → Lucide icon mapping for filter chips */
export const CATEGORY_ICONS: Record<string, ElementType> = {
  All: ClipboardList,
  Personality: Brain,
  "Mental Health": ClipboardList,
  Stress: BarChart2,
  "Internet & Technology": Monitor,
  Resilience: ShieldCheck,
};

/* ═══════════════════════════════════════════════════════
   Sort Logic
   ═══════════════════════════════════════════════════════ */

export type SortBy = "name" | "items" | "respondents" | "alpha";

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "items", label: "Items" },
  { value: "respondents", label: "Respondents" },
  { value: "alpha", label: "Reliability (α)" },
];

/** Pure function — safe for use on both server and client */
export function filterAndSortTests(
  searchQuery: string,
  activeCategory: string,
  sortBy: SortBy,
): TestMeta[] {
  const q = searchQuery.toLowerCase();

  let items = TESTS.filter((t) => {
    const matchSearch =
      q === "" ||
      t.name.toLowerCase().includes(q) ||
      t.shortName.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchCategory =
      activeCategory === "All" || t.primaryCategory === activeCategory;
    return matchSearch && matchCategory;
  });

  items = [...items].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.shortName.localeCompare(b.shortName);
      case "items":
        return b.itemCount - a.itemCount;
      case "respondents":
        return (b.respondentCount ?? 0) - (a.respondentCount ?? 0);
      case "alpha":
        return parseFloat(b.alpha ?? "0") - parseFloat(a.alpha ?? "0");
      default:
        return 0;
    }
  });

  return items;
}

/** Utility: fetch a single test by ID */
export function getTestMeta(testId: string): TestMeta | undefined {
  return TESTS.find((t) => t.id === testId);
}
