import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { testSessions } from "./sessions";

export const sessionDemographics = pgTable("session_demographics", {
  sessionId: uuid("session_id")
    .primaryKey()
    .references(() => testSessions.id, { onDelete: "cascade" }),
  name: text("name"),
  sex: text("sex"),
  age: integer("age"),
  province: text("province"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
