// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit, recordFailedAttempt, resetOnSuccess } from "@/lib/admin-auth/rate-limiter";

describe("admin rate limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset internal maps for test isolation
    resetOnSuccess("test@example.com", "127.0.0.1");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows first attempt", () => {
    const result = checkRateLimit("fresh@test.com", "1.2.3.4");
    expect(result.allowed).toBe(true);
  });

  it("blocks IP after 5 failures with 5min cooldown", () => {
    const ip = "192.168.1.1";
    const email = "a@test.com";
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(email, ip);
    }
    const result = checkRateLimit(email, ip);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("ip_cooldown");

    // After 5 minutes, should be allowed again
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    const after = checkRateLimit(email, ip);
    expect(after.allowed).toBe(true);
  });

  it("locks account after 10 failures", () => {
    const email = "victim@test.com";
    for (let i = 0; i < 10; i++) {
      recordFailedAttempt(email, `10.0.0.${i + 1}`);
    }
    const result = checkRateLimit(email, "10.0.0.99");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("account_locked");
  });

  it("resets counters on success", () => {
    const ip = "10.0.0.1";
    const email = "b@test.com";
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt(email, ip);
    }
    resetOnSuccess(email, ip);
    recordFailedAttempt(email, ip);
    const result = checkRateLimit(email, ip);
    expect(result.allowed).toBe(true);
  });

  it("returns retryAfterMs for IP cooldown", () => {
    const ip = "192.168.2.1";
    const email = "c@test.com";
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(email, ip);
    }
    const result = checkRateLimit(email, ip);
    expect(result.retryAfterMs).toBeDefined();
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});
