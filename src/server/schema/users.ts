/**
 * CHP Platform — Users
 *
 * Activated in Phase 2 for Auth.js v5 integration.
 * Auth.js Drizzle adapter maps to this table for user identity.
 *
 * - passwordHash is nullable: null for OAuth-only users, populated for credentials
 * - role: 'user' (default) | 'admin' — used for route-level authorization
 * - isActive: defaults to true; can be set false to soft-delete
 */
import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", {
    withTimezone: true,
    mode: "date",
  }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .default(sql`now()`)
    .notNull()
    .$onUpdate(() => new Date()),
});
