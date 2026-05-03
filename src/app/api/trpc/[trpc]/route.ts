import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createTRPCContext } from "@/server/trpc";

const handler = async (req: Request) => {
  /**
   * Shared mutable headers for tRPC procedures to set cookies.
   * cookies().set() from next/headers doesn't work inside
   * fetchRequestHandler — the Set-Cookie never reaches the browser.
   * Instead, procedures append Set-Cookie to this object, and we
   * merge it into the final Response below.
   */
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

  // Merge any Set-Cookie headers from tRPC procedures into the response
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
