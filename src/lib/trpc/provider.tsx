"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "./client";

/**
 * Sensible React Query defaults (Poka-Yoke):
 * - `retry: 1`      → attempt once more on failure, then surface the error.
 * - `staleTime: 30s` → prevents re-fetching within 30 s window (no infinite loops).
 * - `refetchOnWindowFocus: false` → avoids surprise background refetches during dev.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

/**
 * Resolves the tRPC base URL for both SSR and client contexts.
 * During SSR, `window` is undefined and we need the full origin.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  // Vercel provides this automatically
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Fallback to localhost for local development
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * TRPCProvider wraps the app tree with both the tRPC client and React Query
 * provider. It uses `httpBatchLink` for request batching.
 * SuperJSON handles Date, Map, Set, and BigInt serialization.
 *
 * NOTE: `httpBatchStreamLink` cannot be used here because streaming sends
 * HTTP headers before procedures finish, which prevents Set-Cookie from
 * reaching the browser. `httpBatchLink` waits for all procedures to complete.
 *
 * Usage in `layout.tsx`:
 * ```tsx
 * <TRPCProvider>{children}</TRPCProvider>
 * ```
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // Use useState to ensure one QueryClient and one tRPC client per React tree,
  // preventing re-creation on every render.
  const [queryClient] = useState(makeQueryClient);
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            return {
              "x-trpc-source": "react",
            };
          },
          fetch: (url, options) => {
            return fetch(url, { ...options, credentials: "include" });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
