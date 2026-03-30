/**
 * CHP Platform — Admin Domain
 *
 * Tables: adminUsers, auditLogs
 *
 * Admin users operate the platform via the admin panel. Audit logs
 * capture all state-changing actions for compliance and forensics.
 *
 * Security notes:
 * - passwordHash must use bcrypt or argon2id (application layer)
 * - ipHash in auditLogs uses SHA-256, consistent with session domain
 * - auditLogs.adminUserId is SET NULL on admin deletion to preserve logs
 */
import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { roleEnum } from "./enums";

// ── adminUsers ───────────────────────────────────────────────────────

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("admin").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at", {
    withTimezone: true,
    mode: "date",
  }),
});

// ── auditLogs ────────────────────────────────────────────────────────
// Immutable append-only log of admin actions. ON DELETE SET NULL
// preserves the log entry even if the admin account is removed.

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_audit_logs_admin_user_id").on(t.adminUserId),
    index("idx_audit_logs_entity").on(t.entityType, t.entityId),
    index("idx_audit_logs_created_at").on(t.createdAt),
  ]
);
