/**
 * CHP Platform — Admin JWT Management
 *
 * Standalone JWT auth for the admin panel using jose.
 * Sliding window: 30min exp, 8h hard cap from original iat.
 *
 * Cookie: admin-token (HttpOnly, Secure, SameSite=Strict)
 */
import { SignJWT, jwtVerify } from "jose";

const ADMIN_JWT_EXP = "30m";
const ADMIN_HARD_CAP_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface AdminTokenPayload {
  adminId: string;
  role: string;
  email: string;
  name: string;
  iat: number; // original login timestamp (seconds)
}

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(params: {
  adminId: string;
  role: string;
  email: string;
  name: string;
  originalIat?: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const iat = params.originalIat ?? now;

  return new SignJWT({
    sub: params.adminId,
    role: params.role,
    email: params.email,
    name: params.name,
    iat,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(ADMIN_JWT_EXP)
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    const iat = payload.iat as number | undefined;
    if (!iat) return null;

    // Hard cap: reject if original login was >8h ago
    const nowMs = Date.now();
    if (nowMs - iat * 1000 > ADMIN_HARD_CAP_MS) return null;

    return {
      adminId: payload.sub as string,
      role: payload.role as string,
      email: payload.email as string,
      name: payload.name as string,
      iat,
    };
  } catch {
    return null;
  }
}
