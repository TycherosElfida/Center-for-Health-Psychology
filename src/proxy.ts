/**
 * CHP Platform — Proxy (Next.js 16 Route Guard)
 *
 * Next.js 16 breaking change: `middleware.ts` is renamed to `proxy.ts`.
 * The exported function must be named `proxy`, not `middleware`.
 *
 * This proxy performs OPTIMISTIC auth checks only — it reads the session
 * cookie but does NOT hit the database. Database-level authorization
 * happens in the DAL (src/lib/auth/dal.ts).
 *
 * Route protection strategy:
 * - /dashboard, /profile, /history → redirect to /login if no session
 * - /admin/* → redirect to /admin/login if no session
 * - /login, /signup → redirect to /dashboard if already authenticated
 * - All other routes → pass through (public)
 *
 * The anonymous assessment flow (/test/*, /results/*) is explicitly
 * NOT gated — it must remain fully functional without authentication.
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth?.user;

  // Protected route patterns — require authentication
  const protectedPaths = ["/dashboard", "/profile", "/history"];
  const adminPaths = ["/admin"];
  const authPaths = ["/login", "/signup"];

  const isProtectedPath = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
  const isAdminPath = adminPaths.some((p) => nextUrl.pathname.startsWith(p));
  const isAuthPath = authPaths.some((p) => nextUrl.pathname.startsWith(p));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/signup
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Admin routes: require auth (full admin isolation in Phase 2C)
  if (isAdminPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (Auth.js route handler)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     * - Static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
