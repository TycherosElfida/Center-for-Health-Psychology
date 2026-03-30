/**
 * CHP Platform — Users (Dormant SaaS Table)
 *
 * This table is NOT activated in Phase 1 (KP MVP).
 * It exists so the schema is SaaS-ready for Phase 2 user registration.
 *
 * Phase 2 activation steps:
 * 1. Set isActive default to true
 * 2. Wire Auth.js adapter to this table
 * 3. Add testSessions.userId FK (optional — links sessions to accounts)
 * 4. Implement RLS policies to restrict researcher access
 */
import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", {
    withTimezone: true,
    mode: "date",
  }),
  image: text("image"),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});
