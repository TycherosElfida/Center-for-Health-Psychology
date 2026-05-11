/**
 * CHP Platform — Admin Audit Log Router (1D.13)
 *
 * Single read-only procedure: getAuditLog
 *
 * Features:
 * - Server-side pagination with LIMIT/OFFSET
 * - Quick filters: 24h, week, security, mine
 * - Full filter bar: search, actorId, action, entityType, date range
 * - Role scoping: admin sees own activity only, super_admin sees all
 * - Entity label resolution via LEFT JOIN (Option A):
 *     test → tests.title
 *     admin_user → concat(name, ' · ', email)
 *     question → left(question_text, 60)
 *     others → entity_type:entity_id(8)
 * - Returns: entries, total, pageCount, actors list, distinct actions
 *
 * Security:
 * - Read-only — no mutations, no writes
 * - Uses adminProcedure (both admin + super_admin can access)
 * - admin role scoping enforced server-side, not client-side
 */
import { z } from "zod";
import { eq, ilike, and, or, count, gte, lte, inArray, sql } from "drizzle-orm";
import { createTRPCRouter, adminProcedure } from "../index";
import { adminUsers, auditLogs } from "../../schema/admin";

// ── Zod Schema ───────────────────────────────────────────────────────

const getAuditLogSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  actorId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  quickFilter: z.enum(["24h", "week", "security", "mine"]).optional(),
});

// ── Security action list ─────────────────────────────────────────────

const SECURITY_ACTIONS = [
  "auth.login_success",
  "auth.login_failed",
  "auth.logout",
  "account.admin_locked",
  "account.admin_unlocked",
  "account.session_invalidated",
  "account.password_reset_forced",
  "account.password_changed",
];

// ── Router ───────────────────────────────────────────────────────────

export const adminAuditRouter = createTRPCRouter({
  getAuditLog: adminProcedure.input(getAuditLogSchema).query(async ({ ctx, input }) => {
    const { page, limit } = input;
    const offset = (page - 1) * limit;

    // ── Build WHERE conditions ───────────────────────────────────

    const conditions = [];

    // Role scoping: admin sees own activity only
    if (ctx.adminSession.role !== "super_admin") {
      conditions.push(eq(auditLogs.adminUserId, ctx.adminSession.id));
    }

    // Quick filters
    if (input.quickFilter === "24h") {
      conditions.push(gte(auditLogs.createdAt, sql`now() - interval '24 hours'`));
    } else if (input.quickFilter === "week") {
      conditions.push(gte(auditLogs.createdAt, sql`now() - interval '7 days'`));
    } else if (input.quickFilter === "security") {
      conditions.push(inArray(auditLogs.action, SECURITY_ACTIONS));
    } else if (input.quickFilter === "mine") {
      conditions.push(eq(auditLogs.adminUserId, ctx.adminSession.id));
    }

    // Standard filters
    if (input.actorId) {
      conditions.push(eq(auditLogs.adminUserId, input.actorId));
    }
    if (input.action) {
      conditions.push(eq(auditLogs.action, input.action));
    }
    if (input.entityType) {
      conditions.push(eq(auditLogs.entityType, input.entityType));
    }
    if (input.from) {
      conditions.push(gte(auditLogs.createdAt, new Date(input.from)));
    }
    if (input.to) {
      // End of day: add 1 day to make the 'to' date inclusive
      const toDate = new Date(input.to);
      toDate.setDate(toDate.getDate() + 1);
      conditions.push(lte(auditLogs.createdAt, toDate));
    }
    if (input.search) {
      conditions.push(
        or(
          ilike(auditLogs.entityId, `%${input.search}%`),
          ilike(auditLogs.action, `%${input.search}%`)
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // ── Main query: entries with entity label resolution ──────────
    // Uses raw SQL for the complex multi-LEFT-JOIN + CASE expression.
    // Drizzle's query builder doesn't support conditional JOINs cleanly.

    const entriesQuery = sql`
      SELECT
        al.id,
        al.admin_user_id AS "adminUserId",
        al.action,
        al.entity_type AS "entityType",
        al.entity_id AS "entityId",
        al.old_value AS "oldValue",
        al.new_value AS "newValue",
        al.ip_hash AS "ipHash",
        al.created_at AS "createdAt",
        actor.name AS "actorName",
        actor.email AS "actorEmail",
        actor.role AS "actorRole",
        CASE
          WHEN al.entity_type = 'test' THEN t.title
          WHEN al.entity_type = 'admin_user'
            THEN COALESCE(entity_admin.name || ' · ' || entity_admin.email, al.entity_type || ':' || LEFT(al.entity_id, 8))
          WHEN al.entity_type = 'question'
            THEN LEFT(q.question_text, 60)
          ELSE al.entity_type || ':' || LEFT(al.entity_id, 8)
        END AS "entityLabel"
      FROM audit_logs al
      LEFT JOIN admin_users actor ON actor.id = al.admin_user_id
      LEFT JOIN tests t ON al.entity_type = 'test' AND al.entity_id = t.id::text
      LEFT JOIN admin_users entity_admin ON al.entity_type = 'admin_user' AND al.entity_id = entity_admin.id::text
      LEFT JOIN questions q ON al.entity_type = 'question' AND al.entity_id = q.id::text
      ${where ? sql`WHERE ${where}` : sql``}
      ORDER BY al.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // ── Count query ──────────────────────────────────────────────

    const [totalResult] = await ctx.db.select({ total: count() }).from(auditLogs).where(where);

    const total = Number(totalResult?.total ?? 0);
    const pageCount = Math.ceil(total / limit);

    // ── Entries ──────────────────────────────────────────────────

    const entriesResult = await ctx.db.execute(entriesQuery);
    const entries = (entriesResult.rows ?? entriesResult) as Array<{
      id: string;
      adminUserId: string | null;
      action: string;
      entityType: string;
      entityId: string;
      oldValue: unknown;
      newValue: unknown;
      ipHash: string | null;
      createdAt: string;
      actorName: string | null;
      actorEmail: string | null;
      actorRole: string | null;
      entityLabel: string;
    }>;

    // ── Metadata: actors + distinct actions (parallel) ───────────

    const [actorsResult, actionsResult] = await Promise.all([
      ctx.db
        .selectDistinctOn([adminUsers.id], {
          id: adminUsers.id,
          name: adminUsers.name,
          email: adminUsers.email,
        })
        .from(adminUsers)
        .innerJoin(auditLogs, eq(auditLogs.adminUserId, adminUsers.id))
        .orderBy(adminUsers.id),
      ctx.db.selectDistinct({ action: auditLogs.action }).from(auditLogs).orderBy(auditLogs.action),
    ]);

    return {
      entries,
      total,
      page,
      pageCount,
      actors: actorsResult,
      actions: actionsResult.map((r) => r.action),
    };
  }),
});
