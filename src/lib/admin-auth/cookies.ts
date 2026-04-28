/**
 * CHP Platform — Admin Auth Cookie Helpers
 *
 * HttpOnly, Secure, SameSite=Strict cookie management
 * for the admin-token JWT.
 */
import { cookies } from "next/headers";

const COOKIE_NAME = "admin-token";

export const ADMIN_COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/admin",
  maxAge: 30 * 60, // 30 minutes (matches JWT exp)
};

export async function getAdminTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function setAdminTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS);
}

export async function clearAdminTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
