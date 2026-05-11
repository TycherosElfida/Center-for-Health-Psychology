/**
 * CHP Platform — Admin User Account Management Router (1D.12)
 *
 * 2 procedures gated by superAdminProcedure:
 *   listUsers — paginated, search by name/email, JOIN for session stats
 *   toggleUserActive — soft deactivate/reactivate with audit log
 *
 * No immediate session kill on deactivation (Q5:B).
 * UI should show: "This user will be blocked from their next login."
 */
import { z } from "zod";
import { eq, ilike, or, count, max } from "drizzle-orm";
import { createTRPCRouter, superAdminProcedure } from "../index";
import { users } from "../../schema/users";
import { testSessions } from "../../schema/sessions";
import { auditLogs } from "../../schema/admin";

// ── Zod Schemas ──────────────────────────────────────────────────────

const listUsersSchema = z.object({
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

const toggleUserActiveSchema = z.object({
  userId: z.string().uuid(),
  active: z.boolean(),
});

// ── Router ───────────────────────────────────────────────────────────

export const adminUserAccountsRouter = createTRPCRouter({
  listUsers: superAdminProcedure.input(listUsersSchema).query(async ({ ctx, input }) => {
    const offset = (input.page - 1) * input.limit;

    const searchCondition = input.search
      ? or(ilike(users.name, `%${input.search}%`), ilike(users.email, `%${input.search}%`))
      : undefined;

    // Main query with LEFT JOIN for session stats
    const rows = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        sessionCount: count(testSessions.id),
        lastSessionAt: max(testSessions.startedAt),
      })
      .from(users)
      .leftJoin(testSessions, eq(testSessions.userId, users.id))
      .where(searchCondition)
      .groupBy(users.id)
      .orderBy(users.createdAt)
      .limit(input.limit)
      .offset(offset);

    // Total count for pagination
    const [totalRow] = await ctx.db.select({ total: count() }).from(users).where(searchCondition);

    return {
      users: rows,
      total: Number(totalRow?.total ?? 0),
      page: input.page,
      limit: input.limit,
    };
  }),

  toggleUserActive: superAdminProcedure
    .input(toggleUserActiveSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ isActive: input.active }).where(eq(users.id, input.userId));

      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: input.active ? "ACTIVATE_USER" : "DEACTIVATE_USER",
        entityType: "user",
        entityId: input.userId,
        newValue: { active: input.active },
      });

      return { success: true };
    }),
});
