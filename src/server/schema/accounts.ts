/**
 * CHP Platform — OAuth Accounts (Auth.js Adapter)
 *
 * Links third-party OAuth providers to users. Required by the
 * @auth/drizzle-adapter even when only using CredentialsProvider,
 * as the adapter expects this table to exist during initialization.
 *
 * Each row represents one linked authentication method for a user.
 * The (provider, providerAccountId) pair is unique — a provider account
 * can only be linked to one CHP user.
 */
import { pgTable, uuid, text, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [uniqueIndex("accounts_provider_account_idx").on(t.provider, t.providerAccountId)]
);
