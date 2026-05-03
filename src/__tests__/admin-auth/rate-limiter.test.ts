import { describe, it, expect, beforeEach } from "vitest";

describe("admin rate limiter", () => {
  let checkRateLimit: typeof import("@/lib/admin-auth/rate-limiter").checkRateLimit;
  let recordFailedAttempt: typeof import("@/lib/admin-auth/rate-limiter").recordFailedAttempt;
  let resetOnSuccess: typeof import("@/lib/admin-auth/rate-limiter").resetOnSuccess;

  beforeEach(async () => {
    // Fresh module instance per test to reset in-memory state
    const { vi } = await import("vitest");
    vi.resetModules();
    const mod = await import("@/lib/admin-auth/rate-limiter");
    checkRateLimit = mod.checkRateLimit;
    recordFailedAttempt = mod.recordFailedAttempt;
    resetOnSuccess = mod.resetOnSuccess;
  });

  it("allows first attempt", () => {
    const result = checkRateLimit("admin@test.com", "1.2.3.4");
    expect(result.allowed).toBe(true);
  });

  it("blocks after 5 IP failures", () => {
    const email = "admin@test.com";
    const ip = "1.2.3.4";
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(email, ip);
    }
    const result = checkRateLimit(email, ip);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("ip_cooldown");
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("blocks after 10 account failures", () => {
    const email = "admin@test.com";
    for (let i = 0; i < 10; i++) {
      recordFailedAttempt(email, `ip-${i}`); // different IPs
    }
    const result = checkRateLimit(email, "new-ip");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("account_locked");
  });

  it("resets on success", () => {
    const email = "admin@test.com";
    const ip = "1.2.3.4";
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt(email, ip);
    }
    resetOnSuccess(email, ip);
    const result = checkRateLimit(email, ip);
    expect(result.allowed).toBe(true);
  });
});
