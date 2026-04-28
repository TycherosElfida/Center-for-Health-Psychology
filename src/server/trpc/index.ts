import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "../db";
import { auth } from "@/lib/auth";

// Create the context that will be available to all procedures
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    headers: opts.headers,
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
 * Checks: valid JWT → active user in DB → session not revoked → role is admin-tier.
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Dynamic import to avoid circular dependency
  const { getAdminTokenFromCookies, verifyAdminToken } = await import("@/lib/admin-auth");
  const { adminUsers } = await import("../schema/admin");
  const { eq } = await import("drizzle-orm");

  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin session required." });
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired admin session." });
  }

  // DB validation: active user + session revocation check
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

  // Session revocation check
  if (admin.sessionInvalidatedAt) {
    const invalidatedAtSec = Math.floor(admin.sessionInvalidatedAt.getTime() / 1000);
    if (payload.iat <= invalidatedAtSec) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Session has been revoked." });
    }
  }

  return next({
    ctx: {
      ...ctx,
      admin: {
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
 * super_admin and admin roles (psychiatrist/researcher cannot mutate).
 */
export const adminMutationProcedure = adminProcedure.use(async ({ ctx, next }) => {
  const mutationRoles = ["super_admin", "admin"];
  if (!mutationRoles.includes(ctx.admin.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient privileges for this operation.",
    });
  }
  return next({ ctx });
});
