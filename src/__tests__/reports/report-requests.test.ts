import { describe, it, expect, beforeAll } from "vitest";
import { resolveRequesterInfo } from "@/server/reports/resolve-requester";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
});

describe("resolveRequesterInfo", () => {
  it("returns guest type with encrypted email when no userId", () => {
    const result = resolveRequesterInfo(null, "guest@test.com");
    expect(result.requesterType).toBe("guest");
    expect(result.encryptedEmail).toBeDefined();
    expect(result.encryptedEmail).not.toBe("guest@test.com");
    expect(result.userId).toBeNull();
  });

  it("returns authenticated type with userId when logged in", () => {
    const result = resolveRequesterInfo("user-uuid-123", "ignored@test.com");
    expect(result.requesterType).toBe("authenticated");
    expect(result.encryptedEmail).toBeNull();
    expect(result.userId).toBe("user-uuid-123");
  });

  it("ignores email for authenticated users", () => {
    const result = resolveRequesterInfo("user-uuid-123", undefined);
    expect(result.requesterType).toBe("authenticated");
    expect(result.encryptedEmail).toBeNull();
    expect(result.userId).toBe("user-uuid-123");
  });

  it("throws when guest provides no email", () => {
    expect(() => resolveRequesterInfo(null, undefined)).toThrow(
      "Email is required for guest report requests"
    );
  });

  it("throws when guest provides empty email", () => {
    expect(() => resolveRequesterInfo(null, "")).toThrow(
      "Email is required for guest report requests"
    );
  });

  it("throws when guest provides whitespace-only email", () => {
    expect(() => resolveRequesterInfo(null, "   ")).toThrow(
      "Email is required for guest report requests"
    );
  });
});
