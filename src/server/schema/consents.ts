import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const guestLeads = pgTable("guest_leads", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  sessionId: text("session_id").notNull(),
  testId: text("test_id").notNull(),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
});

export const consents = pgTable("consents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull().unique(),
  tosAccepted: boolean("tos_accepted").notNull(),
  researchOptIn: boolean("research_opt_in").default(true).notNull(),
  marketingOptIn: boolean("marketing_opt_in").default(false).notNull(),
  consentVersion: text("consent_version").notNull(),
  ipHash: text("ip_hash").notNull(),
  consentedAt: timestamp("consented_at").defaultNow().notNull(),
});
