/**
 * CHP Platform — Auth.js v5 Configuration
 *
 * Central auth configuration using NextAuth v5 with:
 * - Custom Drizzle adapter (kept for future OAuth providers)
 * - JWT sessions — required by CredentialsProvider in Auth.js v5
 *   (database sessions + Credentials throws UnsupportedStrategy)
 * - CredentialsProvider for email+password authentication
 *
 * Security notes:
 * - Passwords are hashed with bcryptjs (cost factor 12)
 * - JWT tokens embed userId and role; signed with AUTH_SECRET
 * - Inactive users (isActive=false) are rejected at login
 *
 * Revocation strategy (Phase 2C):
 * - Add `jti` claim → store in `revokedTokens` table
 * - DAL `verifySession()` checks jti against revoked list
 * - Gives equivalent revocation to database sessions
 */
import NextAuth from "next-auth";
import { CHPDrizzleAdapter } from "@/lib/auth/adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { users } from "@/server/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CHPDrizzleAdapter(), // kept — used for OAuth flows (future)
  basePath: "/api/auth",
  trustHost: true,
  session: { strategy: "jwt" }, // ← CHANGED from 'database'
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user?.passwordHash) return null;
        if (!user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on first sign-in
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
