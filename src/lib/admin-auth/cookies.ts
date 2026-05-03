/**
 * CHP Platform — Admin Auth Cookie Helpers
 *
 * STRUCTURAL CONSTRAINTS (from known bugs):
 * - This file does NOT import `cookies` from "next/headers".
 *   All reads use raw Cookie header parsing.
 *   All writes use resHeaders.append("Set-Cookie", ...).
 * - All cookies use Path=/ only. No other path is ever set.
 * - Secure flag is conditioned on NODE_ENV to avoid localhost issues.
 */

const COOKIE_NAME = "admin-token";
const COOKIE_PATH = "/";
const MAX_AGE_SECONDS = 1800; // 30 minutes — matches JWT exp
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Build the Set-Cookie flag string. Secure is omitted in development
 * because browsers silently drop Secure cookies over HTTP (localhost).
 */
const SET_FLAGS = IS_PRODUCTION
  ? `HttpOnly; Secure; SameSite=Strict; Path=${COOKIE_PATH}; Max-Age=${MAX_AGE_SECONDS}`
  : `HttpOnly; SameSite=Strict; Path=${COOKIE_PATH}; Max-Age=${MAX_AGE_SECONDS}`;

const CLEAR_FLAGS = IS_PRODUCTION
  ? `HttpOnly; Secure; SameSite=Strict; Path=${COOKIE_PATH}; Max-Age=0`
  : `HttpOnly; SameSite=Strict; Path=${COOKIE_PATH}; Max-Age=0`;

/**
 * Parse the admin-token from a raw Cookie header.
 * Used inside tRPC procedures where we have the request Headers object.
 *
 * Returns the token string or null if not found / empty.
 */
export function getAdminTokenFromHeaders(headers: Headers): string | null {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  const prefix = `${COOKIE_NAME}=`;
  const pairs = cookieHeader.split(";");

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (trimmed.startsWith(prefix)) {
      const value = trimmed.slice(prefix.length);
      // JWTs are always >20 chars; skip empty or cleared values
      if (value && value.length > 20) return value;
    }
  }

  return null;
}

/**
 * Append a Set-Cookie header that sets the admin-token.
 * Must be called with the shared resHeaders from tRPC context.
 */
export function setAdminCookie(resHeaders: Headers, token: string): void {
  resHeaders.append("Set-Cookie", `${COOKIE_NAME}=${token}; ${SET_FLAGS}`);
}

/**
 * Append a Set-Cookie header that clears (expires) the admin-token.
 * Must be called with the shared resHeaders from tRPC context.
 */
export function clearAdminCookie(resHeaders: Headers): void {
  resHeaders.append("Set-Cookie", `${COOKIE_NAME}=; ${CLEAR_FLAGS}`);
}
