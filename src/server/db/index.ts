import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

// Create the connection using Neon's serverless HTTP driver
const sql = neon(process.env.DATABASE_URL);

// Initialize Drizzle with the connection and your schema
export const db = drizzle(sql, { schema });
