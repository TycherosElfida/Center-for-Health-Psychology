/**
 * CHP Platform — Report Request Domain
 *
 * Table: reportRequests
 *
 * Admin-gated report request queue. Users (guest or authenticated) request
 * PDF reports of their assessment results. Admins review, approve, or reject
 * requests through the admin dashboard.
 *
 * Status lifecycle:
 *   pending → reviewed → sent
 *   pending → reviewed → rejected (reason optional)
 *   pending → sent        (skip review)
 *   pending → rejected    (skip review, reason optional)
 *
 * PII isolation:
 * - Guest emails are AES-256-GCM encrypted via `src/server/utils/encryption.ts`
 * - Authenticated users resolve email via `userId → users.email`
 * - `encryptedEmail` is the ONLY PII in this table
 *
 * Audit trail:
 * - `reviewedBy` / `reviewedAt` tracks who optionally reviewed the request
 * - `processedBy` / `processedAt` tracks who approved or rejected
 */
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { testSessions, results } from "./sessions";
import { tests } from "./tests";
import { users } from "./users";
import { adminUsers } from "./admin";

export const reportRequests = pgTable(
  "report_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => testSessions.id, { onDelete: "cascade" })
      .notNull(),
    testId: uuid("test_id")
      .references(() => tests.id, { onDelete: "restrict" })
      .notNull(),
    resultId: uuid("result_id")
      .references(() => results.id, { onDelete: "cascade" })
      .notNull(),
    requesterType: text("requester_type").notNull(), // 'guest' | 'authenticated'
    encryptedEmail: text("encrypted_email"), // AES-256-GCM, guests only
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"), // pending | reviewed | sent | rejected
    rejectionReason: text("rejection_reason"),
    reviewedBy: uuid("reviewed_by").references(() => adminUsers.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    processedBy: uuid("processed_by").references(() => adminUsers.id, { onDelete: "set null" }),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_report_requests_session_id").on(t.sessionId),
    index("idx_report_requests_test_id").on(t.testId),
    index("idx_report_requests_status").on(t.status),
    index("idx_report_requests_requested_at").on(t.requestedAt),
  ]
);
