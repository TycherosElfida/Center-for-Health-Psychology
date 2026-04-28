// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

  afterEach(() => {
    vi.useRealTimers();
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
  });

  it("returns null for invalid token", async () => {
    const result = await verifyAdminToken("garbage.token.here");
    expect(result).toBeNull();
  });

  it("returns null for expired token", async () => {
    vi.useFakeTimers();
    const token = await createAdminToken({
      adminId: "abc-123",
      role: "admin",
      email: "admin@test.com",
      name: "Admin",
    });
    // Advance 31 minutes (past 30min exp)
    vi.advanceTimersByTime(31 * 60 * 1000);
    const result = await verifyAdminToken(token);
    expect(result).toBeNull();
  });

  it("returns null when past 8h hard cap", async () => {
    vi.useFakeTimers();
    const token = await createAdminToken({
      adminId: "abc-123",
      role: "admin",
      email: "admin@test.com",
      name: "Admin",
    });
    const fresh = await verifyAdminToken(token);
    expect(fresh).not.toBeNull();

    // Advance 9 hours
    vi.advanceTimersByTime(9 * 60 * 60 * 1000);
    const result = await verifyAdminToken(token);
    expect(result).toBeNull();
  });
});
