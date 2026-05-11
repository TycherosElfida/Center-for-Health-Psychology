/**
 * CHP Platform — Admin Profile Router (1D.14)
 *
 * Two adminProcedure mutations for self-service profile management:
 *   updateProfileName — change own display name
 *   changePassword   — change own password (verifies current, revokes sessions, reissues cookie)
 *
 * Security:
 * - Both mutations operate on ctx.adminSession.id only (no admin-id input)
 * - changePassword verifies current password via bcrypt.compare
 * - changePassword sets sessionInvalidatedAt to revoke sibling sessions, then
 *   immediately reissues a fresh cookie for the current browser (originalIat
 *   defaults to now, past the cutoff)
 * - Both mutations write to audit_logs (password change logs no values)
 */
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, adminProcedure } from "../index";
import { adminUsers, auditLogs } from "../../schema/admin";
import { createAdminToken, setAdminCookie } from "@/lib/admin-auth";

const updateProfileNameSchema = z.object({
  name: z.string().min(1).max(100),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12).max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const adminProfileRouter = createTRPCRouter({
  updateProfileName: adminProcedure
    .input(updateProfileNameSchema)
    .mutation(async ({ ctx, input }) => {
      const [old] = await ctx.db
        .select({ name: adminUsers.name })
        .from(adminUsers)
        .where(eq(adminUsers.id, ctx.adminSession.id))
        .limit(1);

      if (!old) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found." });
      }

      await ctx.db
        .update(adminUsers)
        .set({ name: input.name })
        .where(eq(adminUsers.id, ctx.adminSession.id));

      await ctx.db.insert(auditLogs).values({
        adminUserId: ctx.adminSession.id,
        action: "account.profile_updated",
        entityType: "admin_user",
        entityId: ctx.adminSession.id,
        oldValue: { name: old.name },
        newValue: { name: input.name },
      });

      return { name: input.name };
    }),

  changePassword: adminProcedure.input(changePasswordSchema).mutation(async ({ ctx, input }) => {
    const [admin] = await ctx.db
      .select({ passwordHash: adminUsers.passwordHash })
      .from(adminUsers)
      .where(eq(adminUsers.id, ctx.adminSession.id))
      .limit(1);

    if (!admin) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found." });
    }

    const valid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
    if (!valid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Current password is incorrect.",
      });
    }

    const newHash = await bcrypt.hash(input.newPassword, 10);

    await ctx.db
      .update(adminUsers)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        sessionInvalidatedAt: new Date(),
      })
      .where(eq(adminUsers.id, ctx.adminSession.id));

    const token = await createAdminToken({
      adminId: ctx.adminSession.id,
      role: ctx.adminSession.role,
      email: ctx.adminSession.email,
      name: ctx.adminSession.name,
    });
    setAdminCookie(ctx.resHeaders, token);

    await ctx.db.insert(auditLogs).values({
      adminUserId: ctx.adminSession.id,
      action: "account.password_changed",
      entityType: "admin_user",
      entityId: ctx.adminSession.id,
    });

    return { success: true as const };
  }),
});
