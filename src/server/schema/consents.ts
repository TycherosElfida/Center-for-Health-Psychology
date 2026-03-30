/**
 * CHP Platform — Consent & Lead Capture Domain
 *
 * Tables: consents, guestLeads
 *
 * UU PDP compliance architecture:
 * - `guestLeads.encryptedEmail` stores AES-256-GCM encrypted email strings
 *   using the encrypt/decrypt utilities in `src/server/utils/encryption.ts`.
 * - PII (email) is completely isolated from health data (answers, results).
 *   The only link is via the `sessionId` UUID, which itself is a pseudonym.
 * - `consents` tracks explicit opt-in for research and marketing data use.
 * - IP addresses are stored as SHA-256 hashes, never raw.
 */
import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { testSessions } from "./sessions";
import { tests } from "./tests";

// ── consents ─────────────────────────────────────────────────────────
// Explicit consent record per session. 1:1 with testSessions.
// Required before any data collection begins (UU PDP Article 20).

export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => testSessions.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  tosAccepted: boolean("tos_accepted").notNull(),
  researchOptIn: boolean("research_opt_in").default(true).notNull(),
  marketingOptIn: boolean("marketing_opt_in").default(false).notNull(),
  consentVersion: text("consent_version").notNull(),
  ipHash: text("ip_hash").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// ── guestLeads ───────────────────────────────────────────────────────
// PII-isolated email capture for lead generation and results delivery.
//
// The `encryptedEmail` column stores the output of AES-256-GCM encryption
// in the format "base64(iv):base64(ciphertext):base64(authTag)".
// Use `encrypt()` before INSERT and `decrypt()` after SELECT.
//
// This table is the ONLY place in the session domain where PII exists.
// Researchers with DB access to testSessions/answers/results cannot
// reconstruct participant identity without the ENCRYPTION_KEY.

export const guestLeads = pgTable(
  "guest_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => testSessions.id, { onDelete: "cascade" })
      .notNull(),
    testId: uuid("test_id")
      .references(() => tests.id, { onDelete: "restrict" })
      .notNull(),
    encryptedEmail: text("encrypted_email").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_guest_leads_session_id").on(t.sessionId),
    index("idx_guest_leads_test_id").on(t.testId),
  ]
);
