import { db } from "../src/server/db";
import { testSessions } from "../src/server/schema/sessions";
import { sessionDemographics } from "../src/server/schema/session-demographics";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Fetching a test session...");
  const [session] = await db.select().from(testSessions).limit(1);

  if (!session) {
    console.error("No test session found in DB to link demographics against.");
    process.exit(1);
  }
  const sessionId = session.id;
  console.log("Using Session:", sessionId);

  console.log("Calling insert sessionDemographics...");
  try {
    await db
      .insert(sessionDemographics)
      .values({
        sessionId,
        name: "Test User",
        sex: "Male",
        age: 25,
        province: "Test Province",
        city: "Test City",
      })
      .onConflictDoUpdate({
        target: sessionDemographics.sessionId,
        set: {
          name: sql`EXCLUDED.name`,
          sex: sql`EXCLUDED.sex`,
          age: sql`EXCLUDED.age`,
          province: sql`EXCLUDED.province`,
          city: sql`EXCLUDED.city`,
        },
      });
    console.log("Success: inserted demographics");
  } catch (err) {
    console.error("Error from insert:", err);
  }

  process.exit(0);
}

main().catch(console.error);
