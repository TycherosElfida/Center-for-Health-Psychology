/**
 * CHP Platform — Session & Response Domain
 *
 * Tables: testSessions, answers, results
 *
 * This domain captures assessment attempts, individual responses, and
 * computed scores. PII (guestEmail) has been deliberately moved to
 * `guestLeads` (consents.ts) for UU PDP data isolation.
 *
 * Key design decisions:
 * - testVersion is snapshotted at session creation for reproducibility
 * - answers has a composite unique on (sessionId, questionId) to prevent duplicates
 * - results.testId is an intentional denormalization for query performance
 * - results.totalScore and resultLabel are extracted from JSONB for direct SQL access
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { sessionStatusEnum } from "./enums";
import { tests, questions } from "./tests";
import { users } from "./users";

// ── testSessions ─────────────────────────────────────────────────────
// A single assessment attempt by a participant.
// No PII stored here — email is in guestLeads, IP is hashed.

export const testSessions = pgTable(
  "test_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .references(() => tests.id, { onDelete: "restrict" })
      .notNull(),
    testVersion: integer("test_version").notNull(),
    status: sessionStatusEnum("status").default("in_progress").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    ipHash: text("ip_hash").notNull(),
    userAgentHash: text("user_agent_hash").notNull(),
    // Phase 2: Auth — nullable FK links anonymous sessions to authenticated users
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Phase 2: Claim token — cryptographic UUID v4, single-use, 72h TTL
    claimToken: text("claim_token").unique(),
    claimExpiresAt: timestamp("claim_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (t) => [
    index("idx_sessions_test_id").on(t.testId),
    index("idx_sessions_status").on(t.status),
    index("idx_sessions_test_status").on(t.testId, t.status),
    index("idx_sessions_started_at").on(t.startedAt),
    index("idx_sessions_user_id").on(t.userId),
    index("idx_sessions_claim_token")
      .on(t.claimToken)
      .where(sql`claim_token IS NOT NULL`),
  ]
);

// ── answers ──────────────────────────────────────────────────────────
// Individual question responses. Value is JSONB to support polymorphic
// answer shapes: { selected: 3 } for Likert, { selected: [1,3] } for
// multi-select, { value: 72 } for slider.

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => testSessions.id, { onDelete: "cascade" })
      .notNull(),
    questionId: uuid("question_id")
      .references(() => questions.id, { onDelete: "restrict" })
      .notNull(),
    value: jsonb("value").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_answers_session_id").on(t.sessionId),
    unique("uq_answers_session_question").on(t.sessionId, t.questionId),
  ]
);

// ── results ──────────────────────────────────────────────────────────
// Computed scores for a completed session. One result per session (1:1).
//
// results.testId is a deliberate denormalization: it duplicates
// testSessions.testId so admin dashboards can filter results by test
// without joining through testSessions.

export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => testSessions.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    testId: uuid("test_id")
      .references(() => tests.id, { onDelete: "restrict" })
      .notNull(),
    totalScore: numeric("total_score", { precision: 10, scale: 2 }),
    dimensionScores: jsonb("dimension_scores"),
    rawScores: jsonb("raw_scores").notNull(),
    computedScores: jsonb("computed_scores").notNull(),
    resultLabel: text("result_label"),
    scoringVersion: integer("scoring_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_results_test_id").on(t.testId),
    index("idx_results_created_at").on(t.createdAt),
  ]
);
