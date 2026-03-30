/**
 * CHP Platform — PostgreSQL Enum Definitions
 *
 * Extracted into a dedicated file to prevent circular imports between
 * domain schema files. All enums are pure value definitions with no
 * table references.
 */
import { pgEnum } from "drizzle-orm/pg-core";

// ── Test Domain ──────────────────────────────────────────────────────

export const questionTypeEnum = pgEnum("question_type", [
  "likert_5",
  "likert_7",
  "multiple_choice",
  "slider",
  "multi_select",
]);

export const algorithmEnum = pgEnum("scoring_algorithm", [
  "summative",
  "weighted",
  "reversed",
  "dimensional",
  "percentile",
]);

export const severityEnum = pgEnum("severity_level", ["low", "moderate", "high", "critical"]);

// ── Session Domain ───────────────────────────────────────────────────

export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

// ── Admin Domain ─────────────────────────────────────────────────────

export const roleEnum = pgEnum("admin_role", [
  "super_admin",
  "admin",
  "psychiatrist",
  "researcher",
]);
