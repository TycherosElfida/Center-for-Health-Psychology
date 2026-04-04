/**
 * Auth.js v5 Route Handler
 *
 * Exposes the NextAuth API at /api/auth/*
 * Handles: signin, signout, callback, session, csrf
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
