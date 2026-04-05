/**
 * Auth Server Actions — Signup
 *
 * Server-side user registration with:
 * - Zod validation at the boundary
 * - Email uniqueness check
 * - bcryptjs password hashing (cost factor 12)
 * - Auto-sign-in via Auth.js after successful registration
 *
 * Security: Passwords never logged. Only hashed value stored.
 * The signIn call will throw a NEXT_REDIRECT which Next.js handles.
 */
"use server";

import { db } from "@/server/db";
import { users } from "@/server/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signupAction(formData: FormData): Promise<{ error: string } | undefined> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Data tidak valid." };
  }

  const { name, email, password } = parsed.data;

  // Check email uniqueness
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "Email ini sudah terdaftar. Silakan masuk." };
  }

  // Hash password and insert user
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    name,
    email,
    passwordHash,
    role: "user",
    isActive: true,
  });

  // Auto-login after signup — signIn will throw NEXT_REDIRECT on success
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });

  // This line is unreachable on success (redirect throws),
  // but satisfies TypeScript's return type requirement.
  return undefined;
}
