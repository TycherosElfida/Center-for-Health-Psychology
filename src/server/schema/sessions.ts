import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { tests, questions } from "./tests";

export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

export const testSessions = pgTable("test_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  testId: text("test_id")
    .references(() => tests.id)
    .notNull(),
  guestEmail: text("guest_email"), // Filled after completion
  status: sessionStatusEnum("status").default("in_progress").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  ipHash: text("ip_hash").notNull(),
  userAgentHash: text("user_agent_hash").notNull(),
});

export const answers = pgTable("answers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .references(() => testSessions.id, { onDelete: "cascade" })
    .notNull(),
  questionId: text("question_id")
    .references(() => questions.id)
    .notNull(),
  value: jsonb("value").notNull(),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
});

export const results = pgTable("results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .references(() => testSessions.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  testId: text("test_id")
    .references(() => tests.id)
    .notNull(),
  rawScores: jsonb("raw_scores").notNull(),
  computedScores: jsonb("computed_scores").notNull(),
  scoringVersion: text("scoring_version").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
