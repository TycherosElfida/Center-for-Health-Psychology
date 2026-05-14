/**
 * Profile Router — User profile CRUD
 *
 * Two procedures:
 *   - profile.get: Returns the current user's profile (or null)
 *   - profile.upsert: Creates or updates the user's profile
 *
 * Both require authentication (protectedProcedure).
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { userProfiles } from "@/server/schema/user-profiles";
import { sql } from "drizzle-orm";

export const profileRouter = createTRPCRouter({
  /**
   * Get the current user's saved profile.
   * Returns null if no profile exists yet.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, ctx.session.userId))
      .limit(1);

    return profile ?? null;
  }),

  /**
   * Create or update the user's profile.
   * Uses ON CONFLICT (user_id) DO UPDATE for idempotency.
   */
  upsert: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(100).optional(),
        sex: z.enum(["Male", "Female"]).optional(),
        age: z.number().int().min(5).max(120).optional().nullable(),
        province: z.string().min(1).optional(),
        city: z.string().min(1).optional(),
        avatarUrl: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userProfiles)
        .values({
          userId: ctx.session.userId,
          displayName: input.displayName ?? null,
          sex: input.sex ?? null,
          age: input.age ?? null,
          province: input.province ?? null,
          city: input.city ?? null,
          avatarUrl: input.avatarUrl ?? null,
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            ...(input.displayName !== undefined && { displayName: input.displayName }),
            ...(input.sex !== undefined && { sex: input.sex }),
            ...(input.age !== undefined && { age: input.age }),
            ...(input.province !== undefined && { province: input.province }),
            ...(input.city !== undefined && { city: input.city }),
            ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
            updatedAt: sql`now()`,
          },
        });

      return { success: true as const };
    }),
});
