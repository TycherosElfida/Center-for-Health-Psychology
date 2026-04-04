/**
 * CHP Platform — Auth Sessions (Auth.js Database Sessions)
 *
 * Named `auth_sessions` (not `sessions`) to avoid collision with the
 * existing `test_sessions` table in queries and IDE autocomplete.
 *
 * Auth.js database sessions work as follows:
 * 1. On login, a new row is inserted with a random sessionToken
 * 2. The sessionToken is stored in a cookie (HttpOnly, Secure, SameSite=Lax)
 * 3. On each request, the cookie is read and validated against this table
 * 4. On logout, the row is deleted — instant server-side revocation
 *
 * This is the correct strategy for clinical data: JWT cannot be revoked
 * server-side without a blocklist (which is just a worse database session).
 */
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionToken: text("session_token").unique().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("auth_sessions_user_id_idx").on(t.userId)]
);
