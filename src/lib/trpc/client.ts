import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/trpc/router";

/**
 * Client-side tRPC hook factory.
 *
 * `createTRPCReact` returns an object with `.useQuery`, `.useMutation`, etc.
 * typed to our `AppRouter`. This is the ONLY tRPC entry-point for client
 * components — never import from `@trpc/client` directly in UI code.
 */
export const trpc = createTRPCReact<AppRouter>();
