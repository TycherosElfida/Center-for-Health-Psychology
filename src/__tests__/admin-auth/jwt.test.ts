// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Must stub env before importing the module
vi.stubEnv("ADMIN_JWT_SECRET", "test-secret-must-be-at-least-32-chars-long!!");

describe("admin JWT", () => {
  let createAdminToken: typeof import("@/lib/admin-auth/jwt").createAdminToken;
  let verifyAdminToken: typeof import("@/lib/admin-auth/jwt").verifyAdminToken;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("@/lib/admin-auth/jwt");
    createAdminToken = mod.createAdminToken;
    verifyAdminToken = mod.verifyAdminToken;
  });

  it("creates a valid JWT and verifies it", async () => {
    const token = await createAdminToken({
      adminId: "abc-123",
      role: "super_admin",
      email: "admin@test.com",
      name: "Admin",
    });
    expect(typeof token).toBe("string");

    const payload = await verifyAdminToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.adminId).toBe("abc-123");
    expect(payload!.role).toBe("super_admin");
    expect(payload!.email).toBe("admin@test.com");
    expect(payload!.originalIat).toBeTypeOf("number");
  });

  it("returns null for invalid token", async () => {
    const result = await verifyAdminToken("garbage.token.here");
    expect(result).toBeNull();
  });

  it("returns null for expired token (31min)", async () => {
    vi.useFakeTimers();
    const token = await createAdminToken({
      adminId: "abc-123",
      role: "admin",
      email: "admin@test.com",
      name: "Admin",
    });
    vi.advanceTimersByTime(31 * 60 * 1000);
    const result = await verifyAdminToken(token);
    expect(result).toBeNull();
    vi.useRealTimers();
  });

  it("returns null past 8h hard cap", async () => {
    vi.useFakeTimers();
    const token = await createAdminToken({
      adminId: "abc-123",
      role: "admin",
      email: "admin@test.com",
      name: "Admin",
    });
    // Verify it works now
    const fresh = await verifyAdminToken(token);
    expect(fresh).not.toBeNull();

    // Advance 8h + 1min
    vi.advanceTimersByTime(8 * 60 * 60 * 1000 + 60_000);
    // Create a "refreshed" token (simulates sliding window)
    const refreshed = await createAdminToken({
      adminId: "abc-123",
      role: "admin",
      email: "admin@test.com",
      name: "Admin",
      originalIat: fresh!.originalIat, // preserve original login time
    });
    const result = await verifyAdminToken(refreshed);
    expect(result).toBeNull();
    vi.useRealTimers();
  });

  it("preserves originalIat on refresh", async () => {
    const token1 = await createAdminToken({
      adminId: "abc-123",
      role: "admin",
      email: "admin@test.com",
      name: "Admin",
    });
    const payload1 = await verifyAdminToken(token1);

    const token2 = await createAdminToken({
      adminId: "abc-123",
      role: "admin",
      email: "admin@test.com",
      name: "Admin",
      originalIat: payload1!.originalIat,
    });
    const payload2 = await verifyAdminToken(token2);

    expect(payload2!.originalIat).toBe(payload1!.originalIat);
  });
});
