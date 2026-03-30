import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM encryption utilities for UU PDP compliance.
 *
 * Format: base64(iv):base64(ciphertext):base64(authTag)
 *
 * The encryption key is a 32-byte (256-bit) hex-encoded string loaded from
 * the ENCRYPTION_KEY environment variable. Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Security properties of AES-256-GCM:
 * - Confidentiality: 256-bit key strength
 * - Integrity: 128-bit authentication tag detects tampering
 * - Nonce uniqueness: 12-byte random IV per encryption (collision probability
 *   negligible below ~2^48 encryptions)
 */

const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH = 12; // 96 bits — NIST recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
        "Generate one: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt (e.g., an email address)
 * @returns Encrypted string in format "base64(iv):base64(ciphertext):base64(authTag)"
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), encrypted.toString("base64"), authTag.toString("base64")].join(
    ":"
  );
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 *
 * @param encryptedPayload - String in format "base64(iv):base64(ciphertext):base64(authTag)"
 * @returns The original plaintext string
 * @throws Error if the payload is malformed or authentication fails (tampered data)
 */
export function decrypt(encryptedPayload: string): string {
  const key = getKey();
  const parts = encryptedPayload.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format. Expected 'iv:ciphertext:authTag'.");
  }

  const [ivB64, ciphertextB64, tagB64] = parts as [string, string, string];
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }
  if (authTag.length !== TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${TAG_LENGTH}, got ${authTag.length}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}
