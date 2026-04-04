/**
 * CHP Platform — Custom Auth.js Adapter for Drizzle ORM 1.0-beta
 *
 * The official @auth/drizzle-adapter is incompatible with drizzle-orm@1.0.0-beta
 * because it attempts to import `PgDatabase` from `drizzle-orm/pg-core`, which
 * was removed in the 1.0-beta rewrite.
 *
 * This adapter implements the full Auth.js Adapter interface using our existing
 * Drizzle schema and query builder. It supports:
 *   - User CRUD (create, get by id/email/account)
 *   - Account linking (OAuth providers)
 *   - Database sessions (create, read, update, delete)
 *   - Verification tokens (create, consume)
 *
 * Reference: https://authjs.dev/reference/core/adapters
 */
import type { Adapter, AdapterUser, AdapterSession, AdapterAccount } from "next-auth/adapters";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/schema/users";
import { accounts } from "@/server/schema/accounts";
import { authSessions } from "@/server/schema/authSessions";
import { verificationTokens } from "@/server/schema/verificationTokens";

function toAdapterUser(row: typeof users.$inferSelect): AdapterUser {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.emailVerified,
    name: row.name,
    image: row.image,
  };
}

function toAdapterSession(row: typeof authSessions.$inferSelect): AdapterSession {
  return {
    sessionToken: row.sessionToken,
    userId: row.userId,
    expires: row.expires,
  };
}

export function CHPDrizzleAdapter(): Adapter {
  return {
    // ── User operations ──────────────────────────────────────────

    async createUser(data) {
      const [row] = await db
        .insert(users)
        .values({
          email: data.email,
          emailVerified: data.emailVerified,
          name: data.name ?? null,
          image: data.image ?? null,
        })
        .returning();
      if (!row) throw new Error("Failed to create user");
      return toAdapterUser(row);
    },

    async getUser(id) {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async getUserByEmail(email) {
      const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const [result] = await db
        .select({ user: users })
        .from(accounts)
        .innerJoin(users, eq(users.id, accounts.userId))
        .where(
          and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId))
        )
        .limit(1);

      return result?.user ? toAdapterUser(result.user) : null;
    },

    async updateUser(data) {
      if (!data.id) throw new Error("User ID is required for update");
      const [row] = await db
        .update(users)
        .set({
          name: data.name ?? undefined,
          email: data.email ?? undefined,
          emailVerified: data.emailVerified ?? undefined,
          image: data.image ?? undefined,
        })
        .where(eq(users.id, data.id))
        .returning();
      if (!row) throw new Error("Failed to update user");
      return toAdapterUser(row);
    },

    async deleteUser(userId) {
      await db.delete(users).where(eq(users.id, userId));
    },

    // ── Account (OAuth provider) operations ──────────────────────

    async linkAccount(data) {
      await db.insert(accounts).values({
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refresh_token: data.refresh_token ?? null,
        access_token: data.access_token ?? null,
        expires_at: data.expires_at ?? null,
        token_type: data.token_type ?? null,
        scope: data.scope ?? null,
        id_token: data.id_token ?? null,
        session_state: (data.session_state as string) ?? null,
      });
      return data as AdapterAccount;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await db
        .delete(accounts)
        .where(
          and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId))
        );
    },

    // ── Session operations ───────────────────────────────────────

    async createSession(data) {
      const [row] = await db
        .insert(authSessions)
        .values({
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: data.expires,
        })
        .returning();
      if (!row) throw new Error("Failed to create session");
      return toAdapterSession(row);
    },

    async getSessionAndUser(sessionToken) {
      const [result] = await db
        .select({ session: authSessions, user: users })
        .from(authSessions)
        .innerJoin(users, eq(users.id, authSessions.userId))
        .where(eq(authSessions.sessionToken, sessionToken))
        .limit(1);

      if (!result) return null;
      return {
        session: toAdapterSession(result.session),
        user: toAdapterUser(result.user),
      };
    },

    async updateSession(data) {
      const [row] = await db
        .update(authSessions)
        .set({
          expires: data.expires ?? undefined,
        })
        .where(eq(authSessions.sessionToken, data.sessionToken))
        .returning();
      if (!row) return null;
      return toAdapterSession(row);
    },

    async deleteSession(sessionToken) {
      await db.delete(authSessions).where(eq(authSessions.sessionToken, sessionToken));
    },

    // ── Verification token operations ────────────────────────────

    async createVerificationToken(data) {
      const [row] = await db
        .insert(verificationTokens)
        .values({
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        })
        .returning();
      if (!row) return null;
      return {
        identifier: row.identifier,
        token: row.token,
        expires: row.expires,
      };
    },

    async useVerificationToken({ identifier, token }) {
      const [row] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token))
        )
        .limit(1);

      if (!row) return null;

      await db
        .delete(verificationTokens)
        .where(
          and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token))
        );

      return {
        identifier: row.identifier,
        token: row.token,
        expires: row.expires,
      };
    },
  };
}
