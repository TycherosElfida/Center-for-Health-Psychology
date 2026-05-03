/**
 * CHP Platform — Admin JWT Management
 *
 * Standalone JWT auth for the admin panel using jose.
 *
 * Token lifecycle:
 * - 30-minute sliding window (exp claim)
 * - 8-hour hard cap from original login (originalIat custom claim)
 * - Every valid adminProcedure request re-issues the token
 * - Hard cap is enforced regardless of activity
 */
import { SignJWT, jwtVerify } from "jose";

const ADMIN_JWT_EXP = "30m";
const ADMIN_HARD_CAP_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface AdminTokenPayload {
  adminId: string;
  role: string;
  email: string;
  name: string;
  /** Unix timestamp (seconds) of the original login — survives token refreshes */
  originalIat: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed admin JWT.
 *
 * On first login: omit `originalIat` — it defaults to `now`.
 * On sliding window refresh: pass the existing `originalIat` through
 * to preserve the original login timestamp across refreshes.
 */
export async function createAdminToken(params: {
  adminId: string;
  role: string;
  email: string;
  name: string;
  originalIat?: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const originalIat = params.originalIat ?? now;

  return new SignJWT({
    sub: params.adminId,
    role: params.role,
    email: params.email,
    name: params.name,
    originalIat,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(ADMIN_JWT_EXP)
    .sign(getSecret());
}

/**
 * Verify an admin JWT. Returns the typed payload or null on any failure.
 *
 * Checks performed:
 * 1. Signature validity (jose)
 * 2. Expiration (jose — 30min window)
 * 3. Hard cap: reject if now - originalIat > 8 hours
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    const originalIat = payload.originalIat as number | undefined;
    if (!originalIat) return null;

    // Hard cap: reject if original login was >8h ago
    if (Date.now() - originalIat * 1000 > ADMIN_HARD_CAP_MS) return null;

    return {
      adminId: payload.sub as string,
      role: payload.role as string,
      email: payload.email as string,
      name: payload.name as string,
      originalIat,
    };
  } catch {
    return null;
  }
}
