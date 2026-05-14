/**
 * NavbarWrapper — Server Component that resolves auth state
 * and passes it to the client-side Navbar.
 *
 * Use this instead of importing Navbar directly in pages.
 * This avoids prop drilling auth state through every page.
 */
import { eq } from "drizzle-orm";
import { getOptionalSession } from "@/lib/auth/dal";
import { db } from "@/server/db";
import { users } from "@/server/schema/users";
import { Navbar } from "./Navbar";

export async function NavbarWrapper() {
  const session = await getOptionalSession();

  let userName: string | null = null;
  let userEmail: string | null = null;

  if (session?.userId) {
    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    userName = user?.name ?? null;
    userEmail = user?.email ?? null;
  }

  return <Navbar isAuthenticated={!!session} userName={userName} userEmail={userEmail} />;
}
