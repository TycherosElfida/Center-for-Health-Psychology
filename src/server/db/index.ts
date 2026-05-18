import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../schema";
import { relations } from "../schema/relations";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

// Initialize a connection pool over WebSockets
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize Drizzle with the Neon serverless WebSockets driver.
// `schema` provides table definitions for type inference.
// `relations` enables the relational query API (db.query.*).
export const db = drizzle({ client: pool, schema, relations });
