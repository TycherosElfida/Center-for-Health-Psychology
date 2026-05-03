import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createTRPCContext } from "@/server/trpc";

/**
 * Legacy tRPC route handler — NOT in the App Router path.
 * Kept for reference; the active handler is at src/app/api/trpc/[trpc]/route.ts
 */
const handler = async (req: Request) => {
  const resHeaders = new Headers();

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers, resHeaders }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
          }
        : undefined,
  });

  // Merge Set-Cookie headers
  const setCookies = resHeaders.getSetCookie();
  if (setCookies.length > 0) {
    const newHeaders = new Headers(response.headers);
    for (const cookie of setCookies) {
      newHeaders.append("Set-Cookie", cookie);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
};

export { handler as GET, handler as POST };
