import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "@/server/utils/encryption";

// Use a deterministic 32-byte key for testing (64 hex chars)
beforeAll(() => {
  process.env.ENCRYPTION_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
});

describe("AES-256-GCM encryption", () => {
  it("roundtrips a simple email", () => {
    const email = "test@example.com";
    const encrypted = encrypt(email);
    expect(encrypted).not.toBe(email);
    expect(decrypt(encrypted)).toBe(email);
  });

  it("produces different ciphertexts for same input (unique IV per call)", () => {
    const email = "same@example.com";
    const a = encrypt(email);
    const b = encrypt(email);
    expect(a).not.toBe(b); // Different IVs
    expect(decrypt(a)).toBe(email);
    expect(decrypt(b)).toBe(email);
  });

  it("detects tampered ciphertext", () => {
    const encrypted = encrypt("tamper@test.com");
    const parts = encrypted.split(":");
    // Corrupt the ciphertext segment
    parts[1] = Buffer.from("corrupted-data-here").toString("base64");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("rejects malformed payload (wrong number of segments)", () => {
    expect(() => decrypt("only:two")).toThrow("Invalid encrypted payload format");
  });

  it("handles empty string", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("handles unicode characters", () => {
    const text = "tes+ünïcödé@例え.com";
    expect(decrypt(encrypt(text))).toBe(text);
  });

  it("rejects invalid IV length", () => {
    const encrypted = encrypt("test@test.com");
    const parts = encrypted.split(":");
    // Replace IV with wrong-length buffer
    parts[0] = Buffer.from("short").toString("base64");
    expect(() => decrypt(parts.join(":"))).toThrow("Invalid IV length");
  });

  it("throws when ENCRYPTION_KEY is missing", () => {
    const savedKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("test@test.com")).toThrow("ENCRYPTION_KEY must be");
    process.env.ENCRYPTION_KEY = savedKey;
  });

  it("throws when ENCRYPTION_KEY is wrong length", () => {
    const savedKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = "tooshort";
    expect(() => encrypt("test@test.com")).toThrow("ENCRYPTION_KEY must be");
    process.env.ENCRYPTION_KEY = savedKey;
  });
});
