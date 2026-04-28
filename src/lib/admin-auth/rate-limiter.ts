/**
 * CHP Platform — Admin Login Rate Limiter (Hybrid)
 *
 * IP-based: 5 failures → 5 min cooldown (self-recovering)
 * Account-based: 10 failures → locked (requires super_admin unlock)
 *
 * In-memory — acceptable for <10 admin users.
 */

const IP_MAX_ATTEMPTS = 5;
const IP_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const ACCOUNT_MAX_ATTEMPTS = 10;

interface IPRecord {
  count: number;
  lockedUntil: number | null;
}

interface AccountRecord {
  count: number;
  isLocked: boolean;
}

const ipMap = new Map<string, IPRecord>();
const accountMap = new Map<string, AccountRecord>();

export interface RateLimitResult {
  allowed: boolean;
  reason?: "ip_cooldown" | "account_locked";
  retryAfterMs?: number;
}

export function checkRateLimit(email: string, ip: string): RateLimitResult {
  // Check account lock first
  const acct = accountMap.get(email);
  if (acct?.isLocked) {
    return { allowed: false, reason: "account_locked" };
  }

  // Check IP cooldown
  const ipRec = ipMap.get(ip);
  if (ipRec?.lockedUntil) {
    const now = Date.now();
    if (now < ipRec.lockedUntil) {
      return {
        allowed: false,
        reason: "ip_cooldown",
        retryAfterMs: ipRec.lockedUntil - now,
      };
    }
    // Cooldown expired — reset
    ipMap.delete(ip);
  }

  return { allowed: true };
}

export function recordFailedAttempt(email: string, ip: string): void {
  // IP tracking
  const ipRec = ipMap.get(ip) ?? { count: 0, lockedUntil: null };
  ipRec.count++;
  if (ipRec.count >= IP_MAX_ATTEMPTS) {
    ipRec.lockedUntil = Date.now() + IP_COOLDOWN_MS;
  }
  ipMap.set(ip, ipRec);

  // Account tracking
  const acct = accountMap.get(email) ?? { count: 0, isLocked: false };
  acct.count++;
  if (acct.count >= ACCOUNT_MAX_ATTEMPTS) {
    acct.isLocked = true;
  }
  accountMap.set(email, acct);
}

export function resetOnSuccess(email: string, ip: string): void {
  ipMap.delete(ip);
  accountMap.delete(email);
}
