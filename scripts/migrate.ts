import { config } from "dotenv";
import { readFileSync } from "fs";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

async function runMigration() {
  const { db } = await import("../src/server/db/index");
  console.log("Applying migration...");

  const migrationSQL = readFileSync(
    "src/server/db/migrations/20260518145028_add_test_citations/migration.sql",
    "utf8"
  );

  try {
    const statements = migrationSQL.split("--> statement-breakpoint");
    for (const stmt of statements) {
      if (stmt.trim()) {
        await db.execute(sql.raw(stmt.trim()));
      }
    }
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
  process.exit(0);
}

runMigration();
