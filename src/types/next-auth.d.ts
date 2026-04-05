/**
 * CHP Platform — Auth.js Type Augmentation
 *
 * Extends the default NextAuth types to include the custom `role`
 * field from our users table. With JWT strategy, the token carries
 * `id` and `role` claims that are piped into the session via the
 * session callback.
 */
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
  }
}
