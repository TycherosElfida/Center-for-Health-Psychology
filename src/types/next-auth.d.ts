/**
 * CHP Platform — Auth.js Type Augmentation
 *
 * Extends the default NextAuth Session and User types to include
 * the `role` field from our users table. This ensures type-safe
 * access to `session.user.role` throughout the application.
 *
 * Note: `role` is optional on `User` because the DrizzleAdapter
 * returns an `AdapterUser` that doesn't include custom columns.
 * The session callback handles injecting the role at runtime.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}
