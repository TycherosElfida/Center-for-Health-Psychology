/**
 * CHP Platform — Admin Auth Library (Barrel Export)
 *
 * All admin auth imports should go through this file:
 *   import { createAdminToken, setAdminCookie, ... } from "@/lib/admin-auth";
 */
export { createAdminToken, verifyAdminToken, type AdminTokenPayload } from "./jwt";

export { getAdminTokenFromHeaders, setAdminCookie, clearAdminCookie } from "./cookies";

export {
  checkRateLimit,
  recordFailedAttempt,
  resetOnSuccess,
  type RateLimitResult,
} from "./rate-limiter";
