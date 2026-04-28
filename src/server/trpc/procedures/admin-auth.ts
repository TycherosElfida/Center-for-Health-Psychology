/**
 * CHP Platform — Admin Auth Router
 *
 * Standalone tRPC procedures for admin authentication.
 * Operates independently of Auth.js — uses jose JWT + admin_users table.
 *
 * Procedures:
 *   admin.login        — Authenticate via email/password, issue JWT cookie
 *   admin.logout       — Clear JWT cookie
 *   admin.me           — Return current admin session (from JWT)
 *   admin.changePassword — Force or voluntary password change
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "../index";
import { adminUsers } from "../../schema/admin";
import { auditLogs } from "../../schema/admin";
import {
  createAdminToken,
  verifyAdminToken,
  checkRateLimit,
  recordFailedAttempt,
  resetOnSuccess,
  getAdminTokenFromCookies,
  setAdminTokenCookie,
  clearAdminTokenCookie,
} from "@/lib/admin-auth";
import { createHash } from "crypto";

// ── Helpers ──────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "unknown"
  );
}

// ── Router ───────────────────────────────────────────────────────────

export const adminAuthRouter = createTRPCRouter({
  /**
   * admin.login — Authenticate admin, issue JWT, set HttpOnly cookie.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email().max(255),
        password: z.string().min(1).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ip = getClientIp(ctx.headers);

      // Rate limit check
      const rateCheck = checkRateLimit(input.email, ip);
      if (!rateCheck.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            rateCheck.reason === "account_locked"
              ? "Account locked. Contact a super admin."
              : `Too many attempts. Retry after ${Math.ceil((rateCheck.retryAfterMs ?? 0) / 1000)}s.`,
        });
      }

      // Lookup admin user
      const [admin] = await ctx.db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, input.email))
        .limit(1);

      // Constant-time comparison even if user not found
      if (!admin) {
        await bcrypt.hash(input.password, 10); // waste time to prevent timing
        recordFailedAttempt(input.email, ip);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials.",
        });
      }

      // Check active status
      if (!admin.isActive) {
        recordFailedAttempt(input.email, ip);
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account deactivated. Contact a super admin.",
        });
      }

      // Verify password
      const valid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!valid) {
        recordFailedAttempt(input.email, ip);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials.",
        });
      }

      // Success — reset rate limiter
      resetOnSuccess(input.email, ip);

      // Issue JWT
      const token = await createAdminToken({
        adminId: admin.id,
        role: admin.role,
        email: admin.email,
        name: admin.name,
      });
      await setAdminTokenCookie(token);

      // Update last login
      await ctx.db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, admin.id));

      // Audit log
      await ctx.db.insert(auditLogs).values({
        adminUserId: admin.id,
        action: "login",
        entityType: "admin_user",
        entityId: admin.id,
        ipHash: hashIp(ip),
      });

      return {
        success: true,
        mustChangePassword: admin.mustChangePassword,
      };
    }),

  /**
   * admin.logout — Clear JWT cookie and log the event.
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const token = await getAdminTokenFromCookies();
    const payload = token ? await verifyAdminToken(token) : null;

    await clearAdminTokenCookie();

    if (payload) {
      const ip = getClientIp(ctx.headers);
      await ctx.db.insert(auditLogs).values({
        adminUserId: payload.adminId,
        action: "logout",
        entityType: "admin_user",
        entityId: payload.adminId,
        ipHash: hashIp(ip),
      });
    }

    return { success: true };
  }),

  /**
   * admin.me — Return current admin session from JWT.
   * Returns null if not authenticated (no error thrown).
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const token = await getAdminTokenFromCookies();
    if (!token) return null;

    const payload = await verifyAdminToken(token);
    if (!payload) return null;

    // Validate against DB (session revocation check)
    const [admin] = await ctx.db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        mustChangePassword: adminUsers.mustChangePassword,
        sessionInvalidatedAt: adminUsers.sessionInvalidatedAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, payload.adminId))
      .limit(1);

    if (!admin || !admin.isActive) return null;

    // Session revocation: if sessionInvalidatedAt > JWT iat, reject
    if (admin.sessionInvalidatedAt) {
      const invalidatedAtSec = Math.floor(admin.sessionInvalidatedAt.getTime() / 1000);
      if (payload.iat <= invalidatedAtSec) return null;
    }

    // Sliding window: refresh token on every successful .me call
    const refreshed = await createAdminToken({
      adminId: admin.id,
      role: admin.role,
      email: admin.email,
      name: admin.name,
      originalIat: payload.iat,
    });
    await setAdminTokenCookie(refreshed);

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mustChangePassword: admin.mustChangePassword,
    };
  }),

  /**
   * admin.changePassword — Change the admin's password.
   * Requires current password verification.
   */
  changePassword: publicProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1).max(128),
        newPassword: z.string().min(12, "Password must be at least 12 characters").max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const payload = await verifyAdminToken(token);
      if (!payload) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [admin] = await ctx.db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, payload.adminId))
        .limit(1);

      if (!admin || !admin.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify current password
      const valid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect.",
        });
      }

      // Prevent reuse of the same password
      const isSame = await bcrypt.compare(input.newPassword, admin.passwordHash);
      if (isSame) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New password must differ from current password.",
        });
      }

      // Hash and update
      const newHash = await bcrypt.hash(input.newPassword, 12);
      await ctx.db
        .update(adminUsers)
        .set({
          passwordHash: newHash,
          mustChangePassword: false,
        })
        .where(eq(adminUsers.id, admin.id));

      // Audit log
      const ip = getClientIp(ctx.headers);
      await ctx.db.insert(auditLogs).values({
        adminUserId: admin.id,
        action: "change_password",
        entityType: "admin_user",
        entityId: admin.id,
        ipHash: hashIp(ip),
      });

      return { success: true };
    }),
});
