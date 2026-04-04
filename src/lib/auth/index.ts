/**
 * CHP Platform — Auth.js v5 Configuration
 *
 * Central auth configuration using NextAuth v5 with:
 * - Custom Drizzle adapter for drizzle-orm 1.0-beta compatibility
 * - Database sessions (NOT JWT) for clinical-grade revocation
 * - CredentialsProvider for email+password authentication
 *
 * Security notes:
 * - Passwords are hashed with bcryptjs (cost factor 12)
 * - Sessions are stored server-side; the cookie holds only the sessionToken
 * - Inactive users (isActive=false) are rejected at login
 */
import NextAuth from "next-auth";
import { CHPDrizzleAdapter } from "@/lib/auth/adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { users } from "@/server/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CHPDrizzleAdapter(),
  session: { strategy: "database" },
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
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = (user as any).role ?? "user";
      }
      return session;
    },
  },
});
