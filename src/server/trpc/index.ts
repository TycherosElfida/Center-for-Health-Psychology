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
 * Admin procedure — requires a valid session with admin role.
 * Throws UNAUTHORIZED if not logged in, FORBIDDEN if not admin.
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: { ...ctx, session: ctx.session },
  });
});
