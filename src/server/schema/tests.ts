import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const questionTypeEnum = pgEnum("question_type", [
  "likert_5",
  "likert_7",
  "multiple_choice",
  "slider",
  "multi_select",
]);
export const algorithmEnum = pgEnum("scoring_algorithm", [
  "summative",
  "weighted",
  "reversed",
  "dimensional",
  "percentile",
]);
export const severityEnum = pgEnum("severity_level", [
  "low",
  "moderate",
  "high",
  "critical",
]);

export const tests = pgTable("tests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  version: text("version").notNull().default("1.0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  testId: text("test_id")
    .references(() => tests.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  text: text("text").notNull(),
  type: questionTypeEnum("type").notNull(),
  dimension: text("dimension"),
  isReversed: boolean("is_reversed").default(false).notNull(),
  required: boolean("required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const options = pgTable("options", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  questionId: text("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  label: text("label").notNull(),
  value: integer("value").notNull(),
});

export const scoringRules = pgTable("scoring_rules", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  testId: text("test_id")
    .references(() => tests.id, { onDelete: "cascade" })
    .notNull(),
  algorithm: algorithmEnum("algorithm").notNull(),
  config: jsonb("config").notNull(), // Stores weights, dimension mappings, etc.
  version: text("version").notNull(),
});

export const resultInterpretations = pgTable("result_interpretations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  testId: text("test_id")
    .references(() => tests.id, { onDelete: "cascade" })
    .notNull(),
  dimension: text("dimension"),
  minScore: integer("min_score").notNull(),
  maxScore: integer("max_score").notNull(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
  severity: severityEnum("severity").notNull(),
  version: text("version").notNull(),
});
