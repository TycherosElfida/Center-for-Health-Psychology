/**
 * CHP Platform — Verification Tokens (Auth.js)
 *
 * Used by Auth.js for email verification and magic link authentication.
 * Each token is single-use: after verification, the row is deleted.
 *
 * The composite primary key (identifier, token) ensures uniqueness
 * per email+token combination. No UUID PK — this follows the Auth.js
 * adapter contract exactly.
 */
import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);
