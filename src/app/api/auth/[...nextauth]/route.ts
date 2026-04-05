/**
 * Auth.js v5 Route Handler
 *
 * Exposes the NextAuth API at /api/auth/*
 * Handles: signin, signout, callback, session, csrf
 */
import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

export const GET = async (
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> | { nextauth: string[] } }
) => {
  const params = await ctx.params;
  // @ts-expect-error - Auth.js beta 30 typing workaround
  return handlers.GET(req, { params });
};

export const POST = async (
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> | { nextauth: string[] } }
) => {
  const params = await ctx.params;
  // @ts-expect-error - Auth.js beta 30 typing workaround
  return handlers.POST(req, { params });
};
