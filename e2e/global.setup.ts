import { execSync } from "child_process";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

export default async function globalSetup() {
  console.log("Setting up E2E Test Database...");

  // Load the test environment variables explicitly
  dotenv.config({ path: ".env.test.local", override: true });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is not set in .env.test.local");

  const sql = neon(dbUrl);

  console.log("Dropping existing schema...");
  await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
  await sql`CREATE SCHEMA public;`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`;

  console.log("Pushing database schema...");
  // Run drizzle-kit push using the test DATABASE_URL
  execSync("npx drizzle-kit push --force", {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "inherit",
  });

  console.log("Seeding database...");
  // Environment variables are already loaded from .env.test.local
  const env = {
    ...process.env,
    DATABASE_URL: dbUrl,
  };
  execSync("npx tsx src/server/db/seed.ts", { env, stdio: "inherit" });

  console.log("Fixing admin password policy for tests...");
  await sql`UPDATE admin_users SET must_change_password = false WHERE role = 'super_admin'`;

  console.log("Global setup complete.");
}
