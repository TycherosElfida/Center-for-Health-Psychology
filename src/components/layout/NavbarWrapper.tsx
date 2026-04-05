/**
 * NavbarWrapper — Server Component that resolves auth state
 * and passes it to the client-side Navbar.
 *
 * Use this instead of importing Navbar directly in pages.
 * This avoids prop drilling auth state through every page.
 */
import { getOptionalSession } from "@/lib/auth/dal";
import { Navbar } from "./Navbar";

export async function NavbarWrapper() {
  const session = await getOptionalSession();
  return <Navbar isAuthenticated={!!session} />;
}
