/**
 * CHP Platform — Admin Profile Tests (1D.14)
 *
 * Tests 1–2: updateProfileName input schema validation
 * Tests 3–4: changePassword input schema + refine (confirmPassword match)
 *
 * Pattern: Replicate Zod schemas, validate at input boundary.
 * Matches the convention established in admin-accounts.test.ts.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Replicate Zod schemas (RED phase) ────────────────────────────────

const updateProfileNameSchema = z.object({
  name: z.string().min(1).max(100),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12).max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Tests ────────────────────────────────────────────────────────────

describe("updateProfileName input schema", () => {
  it("1 — accepts a valid name", () => {
    const result = updateProfileNameSchema.safeParse({ name: "Jane Doe" });
    expect(result.success).toBe(true);
  });

  it("2 — rejects empty name", () => {
    const result = updateProfileNameSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("changePassword input schema", () => {
  it("3 — accepts valid input (12+ char new password, matching confirm)", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldSecret1",
      newPassword: "newPass123!XX",
      confirmPassword: "newPass123!XX",
    });
    expect(result.success).toBe(true);
  });

  it("4 — rejects mismatched confirmPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldSecret1",
      newPassword: "newPass123!XX",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "confirmPassword");
      expect(issue?.message).toBe("Passwords do not match");
    }
  });
});
