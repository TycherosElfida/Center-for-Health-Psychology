import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

// Initialize Drizzle with the Neon serverless HTTP driver
export const db = drizzle(process.env.DATABASE_URL, { schema });
