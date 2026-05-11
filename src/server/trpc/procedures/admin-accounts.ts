/**
 * CHP Platform — Admin Account Management Router (1D.12)
 *
 * 8 procedures gated by superAdminProcedure:
 *   listAdmins, getAdminById, createAdmin, updateAdmin,
 *   toggleAdminActive, unlockAdmin, forcePasswordReset,
 *   invalidateAdminSession
 *
 * Security:
 * - All mutations write to audit_logs
 * - Self-protection: cannot deactivate/demote own account
 * - Last super_admin guard: prevents deactivation or demotion
 * - Password hashing: bcryptjs salt 10
 */
import { z } from "zod";
import { eq, ilike, and, or, count, sql, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, superAdminProcedure } from "../index";
import { adminUsers, auditLogs } from "../../schema/admin";

// ── Zod Schemas ──────────────────────────────────────────────────────

const listAdminsSchema = z.object({
  search: z.string().max(200).optional(),
  role: z.enum(["super_admin", "admin", "psychiatrist", "researcher"]).optional(),
  status: z.enum(["active", "inactive", "locked"]).optional(),
});

const getAdminByIdSchema = z.object({
  adminId: z.string().uuid(),
});

const createAdminSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  password: z.string().min(12).max(128),
  role: z.enum(["admin", "psychiatrist", "researcher"]),
});

const updateAdminSchema = z.object({
  adminId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  role: z.enum(["super_admin", "admin", "psychiatrist", "researcher"]).optional(),
});

const toggleAdminActiveSchema = z.object({
  adminId: z.string().uuid(),
  active: z.boolean(),
});

const unlockAdminSchema = z.object({
  adminId: z.string().uuid(),
  forcePasswordReset: z.boolean().optional().default(false),
});

const forcePasswordResetSchema = z.object({
  adminId: z.string().uuid(),
});

const invalidateAdminSessionSchema = z.object({
  adminId: z.string().uuid(),
});

// ── Helpers ──────────────────────────────────────────────────────────

async function writeAuditLog(
  db: typeof import("../../db").db,
  adminUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  await db.insert(auditLogs).values({
    adminUserId,
    action,
    entityType,
    entityId,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  });
}

async function getSuperAdminCount(db: typeof import("../../db").db): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(adminUsers)
    .where(and(eq(adminUsers.role, "super_admin"), eq(adminUsers.isActive, true)));
  return Number(row?.count ?? 0);
}

// ── Router ───────────────────────────────────────────────────────────

export const adminAccountsRouter = createTRPCRouter({
  listAdmins: superAdminProcedure.input(listAdminsSchema).query(async ({ ctx, input }) => {
    const conditions = [];

    if (input.search) {
      conditions.push(
        or(
          ilike(adminUsers.name, `%${input.search}%`),
          ilike(adminUsers.email, `%${input.search}%`)
        )
      );
    }

    if (input.role) {
      conditions.push(eq(adminUsers.role, input.role));
    }

    if (input.status === "active") {
      conditions.push(eq(adminUsers.isActive, true));
    } else if (input.status === "inactive") {
      conditions.push(eq(adminUsers.isActive, false));
    } else if (input.status === "locked") {
      conditions.push(isNotNull(adminUsers.lockedAt));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await ctx.db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        lockedAt: adminUsers.lockedAt,
        mustChangePassword: adminUsers.mustChangePassword,
        createdAt: adminUsers.createdAt,
        lastLoginAt: adminUsers.lastLoginAt,
      })
      .from(adminUsers)
      .where(where)
      .orderBy(adminUsers.createdAt);

    return rows;
  }),

  getAdminById: superAdminProcedure.input(getAdminByIdSchema).query(async ({ ctx, input }) => {
    const [admin] = await ctx.db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        lockedAt: adminUsers.lockedAt,
        lockedReason: adminUsers.lockedReason,
        failedLoginCount: adminUsers.failedLoginCount,
        mustChangePassword: adminUsers.mustChangePassword,
        createdAt: adminUsers.createdAt,
        lastLoginAt: adminUsers.lastLoginAt,
        sessionInvalidatedAt: adminUsers.sessionInvalidatedAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, input.adminId))
      .limit(1);

    if (!admin) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found." });
    }

    return admin;
  }),

  createAdmin: superAdminProcedure.input(createAdminSchema).mutation(async ({ ctx, input }) => {
    const { hash } = await import("bcryptjs");

    // Check for duplicate email
    const [existing] = await ctx.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, input.email.toLowerCase()))
      .limit(1);

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An admin with this email already exists.",
      });
    }

    const passwordHash = await hash(input.password, 10);

    const [created] = await ctx.db
      .insert(adminUsers)
      .values({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        isActive: true,
        mustChangePassword: true,
      })
      .returning({ id: adminUsers.id });

    const createdId = created!.id;

    await writeAuditLog(
      ctx.db,
      ctx.adminSession.id,
      "CREATE_ADMIN",
      "admin_user",
      createdId,
      null,
      { name: input.name, email: input.email.toLowerCase(), role: input.role }
    );

    return { id: createdId };
  }),

  updateAdmin: superAdminProcedure.input(updateAdminSchema).mutation(async ({ ctx, input }) => {
    const { adminId, ...updates } = input;

    // Self-protection: cannot change own role
    if (updates.role && ctx.adminSession.id === adminId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot change your own role.",
      });
    }

    // If demoting a super_admin, check last-super_admin guard
    if (updates.role && updates.role !== "super_admin") {
      const [target] = await ctx.db
        .select({ role: adminUsers.role })
        .from(adminUsers)
        .where(eq(adminUsers.id, adminId))
        .limit(1);

      if (target?.role === "super_admin") {
        const superCount = await getSuperAdminCount(ctx.db);
        if (superCount <= 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot demote the last Super Admin.",
          });
        }
      }
    }

    // Capture old values for audit
    const [oldAdmin] = await ctx.db
      .select({ name: adminUsers.name, role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, adminId))
      .limit(1);

    if (!oldAdmin) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found." });
    }

    const setValues: Record<string, unknown> = {};
    if (updates.name !== undefined) setValues.name = updates.name;
    if (updates.role !== undefined) setValues.role = updates.role;

    if (Object.keys(setValues).length === 0) {
      return { success: true };
    }

    await ctx.db.update(adminUsers).set(setValues).where(eq(adminUsers.id, adminId));

    await writeAuditLog(
      ctx.db,
      ctx.adminSession.id,
      "UPDATE_ADMIN",
      "admin_user",
      adminId,
      oldAdmin,
      setValues
    );

    return { success: true };
  }),

  toggleAdminActive: superAdminProcedure
    .input(toggleAdminActiveSchema)
    .mutation(async ({ ctx, input }) => {
      // Self-protection
      if (ctx.adminSession.id === input.adminId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change your own active status.",
        });
      }

      // Last super_admin guard (deactivation only)
      if (!input.active) {
        const [target] = await ctx.db
          .select({ role: adminUsers.role })
          .from(adminUsers)
          .where(eq(adminUsers.id, input.adminId))
          .limit(1);

        if (target?.role === "super_admin") {
          const superCount = await getSuperAdminCount(ctx.db);
          if (superCount <= 1) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Cannot deactivate the last Super Admin.",
            });
          }
        }
      }

      await ctx.db
        .update(adminUsers)
        .set({ isActive: input.active })
        .where(eq(adminUsers.id, input.adminId));

      await writeAuditLog(
        ctx.db,
        ctx.adminSession.id,
        input.active ? "ACTIVATE_ADMIN" : "DEACTIVATE_ADMIN",
        "admin_user",
        input.adminId,
        null,
        { active: input.active }
      );

      return { success: true };
    }),

  unlockAdmin: superAdminProcedure.input(unlockAdminSchema).mutation(async ({ ctx, input }) => {
    const setValues: Record<string, unknown> = {
      lockedAt: null,
      lockedReason: null,
      failedLoginCount: 0,
    };

    if (input.forcePasswordReset) {
      setValues.mustChangePassword = true;
    }

    await ctx.db.update(adminUsers).set(setValues).where(eq(adminUsers.id, input.adminId));

    await writeAuditLog(
      ctx.db,
      ctx.adminSession.id,
      "UNLOCK_ADMIN",
      "admin_user",
      input.adminId,
      null,
      { forcePasswordReset: input.forcePasswordReset }
    );

    return { success: true };
  }),

  forcePasswordReset: superAdminProcedure
    .input(forcePasswordResetSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(adminUsers)
        .set({ mustChangePassword: true })
        .where(eq(adminUsers.id, input.adminId));

      await writeAuditLog(
        ctx.db,
        ctx.adminSession.id,
        "FORCE_PASSWORD_RESET",
        "admin_user",
        input.adminId
      );

      return { success: true };
    }),

  invalidateAdminSession: superAdminProcedure
    .input(invalidateAdminSessionSchema)
    .mutation(async ({ ctx, input }) => {
      // Self-protection
      if (ctx.adminSession.id === input.adminId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot force logout your own session.",
        });
      }

      await ctx.db
        .update(adminUsers)
        .set({ sessionInvalidatedAt: sql`now()` })
        .where(eq(adminUsers.id, input.adminId));

      await writeAuditLog(
        ctx.db,
        ctx.adminSession.id,
        "INVALIDATE_SESSION",
        "admin_user",
        input.adminId
      );

      return { success: true };
    }),
});
