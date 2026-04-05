/**
 * Protected Layout — (protected) route group
 *
 * All routes under this group require authentication.
 * Uses the server-side DAL `verifySession()` for authoritative
 * database-backed session validation (not just cookie presence).
 *
 * If the session is invalid, redirects to /login.
 */

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
