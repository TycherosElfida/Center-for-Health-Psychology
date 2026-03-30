/**
 * CHP Platform — Test Definition Domain
 *
 * Tables: tests, questions, options, scoringRules, resultInterpretations
 *
 * This domain defines the structure of psychological assessment instruments.
 * All tables use native PostgreSQL uuid PKs and timestamptz for timezone
 * awareness (Indonesia / WIB).
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { questionTypeEnum, algorithmEnum, severityEnum } from "./enums";

// ── tests ────────────────────────────────────────────────────────────
// A validated psychological assessment instrument (e.g., PHQ-9, GAD-7)

export const tests = pgTable(
  "tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_tests_category").on(t.category),
    index("idx_tests_is_published").on(t.isPublished),
  ]
);

// ── questions ────────────────────────────────────────────────────────
// Individual items within a test. Ordered, typed, optionally dimensional.

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .references(() => tests.id, { onDelete: "cascade" })
      .notNull(),
    order: integer("order").notNull(),
    questionText: text("question_text").notNull(),
    type: questionTypeEnum("type").notNull(),
    dimension: text("dimension"),
    isReversed: boolean("is_reversed").default(false).notNull(),
    weight: numeric("weight", { precision: 5, scale: 2 }).default("1.00").notNull(),
    required: boolean("required").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("idx_questions_test_id_order").on(t.testId, t.order)]
);

// ── options ──────────────────────────────────────────────────────────
// Answer choices for a question (e.g., Likert scale labels/values)

export const options = pgTable(
  "options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .references(() => questions.id, { onDelete: "cascade" })
      .notNull(),
    order: integer("order").notNull(),
    label: text("label").notNull(),
    value: integer("value").notNull(),
  },
  (t) => [index("idx_options_question_id_order").on(t.questionId, t.order)]
);

// ── scoringRules ─────────────────────────────────────────────────────
// Declarative scoring configuration per test. Algorithm selection +
// JSONB config for weights, dimension mappings, and custom formulas.

export const scoringRules = pgTable(
  "scoring_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .references(() => tests.id, { onDelete: "cascade" })
      .notNull(),
    algorithm: algorithmEnum("algorithm").notNull(),
    config: jsonb("config").notNull(),
    version: integer("version").notNull().default(1),
  },
  (t) => [index("idx_scoring_rules_test_id").on(t.testId)]
);

// ── resultInterpretations ────────────────────────────────────────────
// Score range → label/recommendation mapping. Drives the results page
// interpretation text and severity indicators.

export const resultInterpretations = pgTable(
  "result_interpretations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .references(() => tests.id, { onDelete: "cascade" })
      .notNull(),
    dimension: text("dimension"),
    minScore: numeric("min_score", { precision: 10, scale: 2 }).notNull(),
    maxScore: numeric("max_score", { precision: 10, scale: 2 }).notNull(),
    label: text("label").notNull(),
    description: text("description").notNull(),
    recommendation: text("recommendation"),
    severity: severityEnum("severity").notNull(),
    version: integer("version").notNull().default(1),
  },
  (t) => [index("idx_result_interp_test_dimension").on(t.testId, t.dimension)]
);
