/**
 * CHP Platform — Data Access Layer (DAL)
 *
 * Centralizes all authorization logic. The DAL is the single source
 * of truth for "who is this user and what can they access?"
 *
 * Design principles:
 * - Server-only: imported via 'server-only' guard — never bundled to client
 * - Memoized: uses React cache() to deduplicate within a render pass
 * - Three tiers:
 *   1. verifySession()       — hard gate (redirects to /login if unauthenticated)
 *   2. verifyAdmin()         — hard gate (calls forbidden() if role != admin)
 *   3. getOptionalSession()  — soft check (returns null if unauthenticated)
 */
import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Verifies the current user session.
 * Redirects to /login if unauthenticated.
 * Use in Server Components and Server Actions only.
 */
export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return {
    userId: session.user.id,
    role: session.user.role ?? "user",
  };
});

/**
 * Verifies the current user is an admin.
 * Calls forbidden() if not authorized.
 *
 * Note: This checks the `role` column on the Auth.js session user.
 * Full admin isolation (adminUsers table) is wired in Phase 2C.
 */
export const verifyAdmin = cache(async () => {
  const session = await verifySession();
  if (session.role !== "admin") {
    const { forbidden } = await import("next/navigation");
    forbidden();
  }
  return session;
});

/**
 * Returns the session or null — never redirects.
 * Use when you need to conditionally show auth-dependent UI
 * (e.g., "Save Your Results" CTA on the results page).
 */
export const getOptionalSession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    role: session.user.role ?? "user",
  };
});
