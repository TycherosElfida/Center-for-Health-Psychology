import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../schema";
import { relations } from "../schema/relations";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

// Initialize Drizzle with the Neon serverless HTTP driver.
// `schema` provides table definitions for type inference.
// `relations` enables the relational query API (db.query.*).
export const db = drizzle(process.env.DATABASE_URL, { schema, relations });
