/**
 * CHP Platform — Identifier Hashing Tests (S-9 remediation)
 *
 * `hashIdentifier` replaces the inline `process.env.ENCRYPTION_KEY ?? ""`
 * pattern in sessions.startSession. The audit (S-9) flagged that the old
 * code silently degraded to an EMPTY HMAC key when ENCRYPTION_KEY was
 * unset — unlike encryption.ts's getKey(), which fails loud. This helper
 * must fail loud too, while producing byte-identical output for a valid
 * key so existing ipHash/userAgentHash values remain reproducible.
 */
import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { hashIdentifier } from "@/server/utils/encryption";

const VALID_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

describe("hashIdentifier (S-9)", () => {
  it("throws when ENCRYPTION_KEY is missing (fail-loud, not empty-key hash)", () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => hashIdentifier("1.2.3.4")).toThrow("ENCRYPTION_KEY");
    process.env.ENCRYPTION_KEY = saved;
  });

  it("throws when ENCRYPTION_KEY is the wrong length", () => {
    const saved = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = "tooshort";
    expect(() => hashIdentifier("1.2.3.4")).toThrow("ENCRYPTION_KEY");
    process.env.ENCRYPTION_KEY = saved;
  });

  it("produces HMAC-SHA256 hex using the raw key string (output preserved)", () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    const expected = createHmac("sha256", VALID_KEY).update("1.2.3.4").digest("hex");
    expect(hashIdentifier("1.2.3.4")).toBe(expected);
  });

  it("is deterministic for the same input + key", () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    expect(hashIdentifier("Mozilla/5.0")).toBe(hashIdentifier("Mozilla/5.0"));
  });
});
