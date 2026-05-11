/**
 * CHP Platform — Admin Auth Router (v2)
 *
 * Three tRPC procedures: admin.login, admin.logout, admin.me
 *
 * STRUCTURAL CONSTRAINTS (from design spec):
 * - All cookie writes go through resHeaders (never cookies().set())
 * - All cookie reads go through getAdminTokenFromHeaders (never cookies().get())
 * - login uses bcrypt.compare + timing-safe DUMMY_HASH for non-existent accounts
 * - logout writes sessionInvalidatedAt BEFORE clearing cookie (safe failure direction)
 * - me queries DB for mustChangePassword (not in JWT payload)
 */
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure, adminProcedure } from "../index";
import { adminUsers } from "../../schema/admin";
import {
  createAdminToken,
  setAdminCookie,
  clearAdminCookie,
  checkRateLimit,
  recordFailedAttempt,
  resetOnSuccess,
} from "@/lib/admin-auth";

// Timing-safe: computed once at module load. bcrypt.hashSync is acceptable
// here because it runs once at cold-start, not per request.
const DUMMY_HASH = bcrypt.hashSync("dummy-timing-safe-value", 10);

export const adminAuthRouter = createTRPCRouter({
  /**
   * admin.login — email/password → JWT cookie
   *
   * Flow:
   * 1. Rate limit check (IP + account)
   * 2. Look up admin by email
   * 3. Compare password (or DUMMY_HASH for non-existent accounts)
   * 4. On success: create JWT, set cookie, update lastLoginAt, reset rate limiter
   * 5. On failure: record failed attempt, return generic error
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Extract IP from standard headers (X-Forwarded-For > X-Real-Ip > "unknown")
      const ip =
        ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        ctx.headers.get("x-real-ip") ??
        "unknown";

      // Step 1: Rate limit
      const rateCheck = checkRateLimit(input.email, ip);
      if (!rateCheck.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            rateCheck.reason === "account_locked"
              ? "Account locked. Contact a super-admin."
              : "Too many attempts. Try again later.",
        });
      }

      // Step 2: Look up admin
      const [admin] = await ctx.db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, input.email.toLowerCase()))
        .limit(1);

      // Step 3: Compare password (timing-safe — always runs bcrypt.compare)
      const hashToCompare = admin?.passwordHash ?? DUMMY_HASH;
      const passwordValid = await bcrypt.compare(input.password, hashToCompare);

      if (!admin || !passwordValid || !admin.isActive) {
        recordFailedAttempt(input.email, ip);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      // Step 4: Success — create JWT, set cookie, update DB
      const token = await createAdminToken({
        adminId: admin.id,
        role: admin.role,
        email: admin.email,
        name: admin.name,
        // originalIat omitted → defaults to now (fresh login)
      });

      setAdminCookie(ctx.resHeaders, token);

      // Update lastLoginAt (non-blocking — fire and forget)
      ctx.db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, admin.id))
        .then(() => {})
        .catch(() => {});

      resetOnSuccess(input.email, ip);

      return {
        success: true as const,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        mustChangePassword: admin.mustChangePassword,
      };
    }),

  /**
   * admin.logout — revoke session + clear cookie
   *
   * CRITICAL ORDER (from design ADR #5):
   * 1. Write sessionInvalidatedAt to DB FIRST
   * 2. Clear browser cookie SECOND
   *
   * If step 1 succeeds but the response drops, the cookie stays in the
   * browser but the server rejects it on next request — SAFE.
   * If step 1 fails, the procedure throws and step 2 never runs —
   * cookie stays valid and server accepts it, but user can retry. UNSAFE BUT RECOVERABLE.
   */
  logout: adminProcedure.mutation(async ({ ctx }) => {
    // Step 1: Server-side revocation — write sessionInvalidatedAt
    await ctx.db
      .update(adminUsers)
      .set({ sessionInvalidatedAt: new Date() })
      .where(eq(adminUsers.id, ctx.adminSession.id));

    // Step 2: Clear browser cookie
    clearAdminCookie(ctx.resHeaders);

    return { success: true as const };
  }),

  /**
   * admin.me — return current admin profile
   *
   * Session fields (id, email, name, role) come from ctx.adminSession (JWT).
   * mustChangePassword comes from DB — it's NOT in the JWT.
   */
  me: adminProcedure.query(async ({ ctx }) => {
    const [admin] = await ctx.db
      .select({
        mustChangePassword: adminUsers.mustChangePassword,
        createdAt: adminUsers.createdAt,
        lastLoginAt: adminUsers.lastLoginAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, ctx.adminSession.id))
      .limit(1);

    return {
      id: ctx.adminSession.id,
      email: ctx.adminSession.email,
      name: ctx.adminSession.name,
      role: ctx.adminSession.role,
      mustChangePassword: admin?.mustChangePassword ?? false,
      createdAt: admin?.createdAt ?? null,
      lastLoginAt: admin?.lastLoginAt ?? null,
    };
  }),
});
