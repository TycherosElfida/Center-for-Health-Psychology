import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "../db";
import { auth } from "@/lib/auth";

// Create the context that will be available to all procedures
export const createTRPCContext = async (opts: { headers: Headers; resHeaders: Headers }) => {
  const session = await auth();

  return {
    db,
    headers: opts.headers,
    /** Mutable response headers — use for Set-Cookie in tRPC procedures */
    resHeaders: opts.resHeaders,
    session: session?.user ? { userId: session.user.id, role: session.user.role ?? "user" } : null,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Create reusable router and procedure helpers
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires a valid authenticated session.
 * Throws UNAUTHORIZED if the user is not logged in.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, session: ctx.session },
  });
});

/**
 * Admin procedure — validates standalone admin JWT (decoupled from Auth.js).
 *
 * Checks performed on every request:
 * 1. Parse admin-token from raw Cookie header (not next/headers)
 * 2. Verify JWT signature + expiration (jose)
 * 3. DB check: admin exists and isActive
 * 4. DB check: sessionInvalidatedAt revocation
 * 5. Sliding window: re-issue token with fresh exp, preserving originalIat
 *
 * STRUCTURAL CONSTRAINTS:
 * - Uses getAdminTokenFromHeaders() — never cookies() from next/headers
 * - Uses setAdminCookie(ctx.resHeaders, ...) — never cookies().set()
 * - Compares sessionInvalidatedAt in seconds (Date→epoch normalization)
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { getAdminTokenFromHeaders, verifyAdminToken, createAdminToken, setAdminCookie } =
    await import("@/lib/admin-auth");
  const { adminUsers } = await import("../schema/admin");
  const { eq } = await import("drizzle-orm");

  // Step 1: Parse token from raw Cookie header
  const token = getAdminTokenFromHeaders(ctx.headers);
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin session required." });
  }

  // Step 2: Verify JWT (signature + exp + 8h hard cap)
  const payload = await verifyAdminToken(token);
  if (!payload) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired admin session." });
  }

  // Step 3: DB validation — active user
  const [admin] = await ctx.db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      sessionInvalidatedAt: adminUsers.sessionInvalidatedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, payload.adminId))
    .limit(1);

  if (!admin || !admin.isActive) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin account not found or deactivated.",
    });
  }

  // Step 4: Session revocation check
  // IMPORTANT: payload.originalIat is seconds, sessionInvalidatedAt is a Date object.
  // Normalize to seconds before comparing.
  if (admin.sessionInvalidatedAt) {
    const invalidatedAtSec = Math.floor(admin.sessionInvalidatedAt.getTime() / 1000);
    if (payload.originalIat <= invalidatedAtSec) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Session has been revoked." });
    }
  }

  // Step 5: Sliding window — re-issue token with fresh exp, same originalIat
  const refreshedToken = await createAdminToken({
    adminId: payload.adminId,
    role: payload.role,
    email: payload.email,
    name: payload.name,
    originalIat: payload.originalIat,
  });
  setAdminCookie(ctx.resHeaders, refreshedToken);

  return next({
    ctx: {
      ...ctx,
      adminSession: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    },
  });
});

/**
 * Admin mutation procedure — same as adminProcedure but restricted to
 * super_admin and admin roles. Psychiatrist and researcher are read-only.
 */
export const adminMutationProcedure = adminProcedure.use(async ({ ctx, next }) => {
  const mutationRoles = ["super_admin", "admin"];
  if (!mutationRoles.includes(ctx.adminSession.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient privileges for this operation.",
    });
  }
  return next({ ctx });
});

/**
 * Super-admin procedure — restricts to super_admin role only.
 * Used for account management operations (1D.12).
 */
export const superAdminProcedure = adminProcedure.use(async ({ ctx, next }) => {
  if (ctx.adminSession.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only Super Admins can manage accounts.",
    });
  }
  return next({ ctx });
});
