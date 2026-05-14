/**
 * CHP Platform — User Profiles
 *
 * Persistent demographic data for authenticated users.
 * Populated from session_demographics on first test or claim.
 * Used to pre-fill the PersonalInfoForm on subsequent tests.
 *
 * Design notes:
 * - 1:1 with users table (userId is PK + FK)
 * - Separate from session_demographics which stores per-session snapshots
 * - age stored as integer (not birthYear) since it's optional
 * - avatarUrl for future profile photo upload
 */
import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  sex: text("sex"), // 'Male' | 'Female'
  age: integer("age"),
  province: text("province"),
  city: text("city"),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .default(sql`now()`)
    .notNull()
    .$onUpdate(() => new Date()),
});
