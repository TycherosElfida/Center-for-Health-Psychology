import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/server/db/index");
  const { questions, tests } = await import("../src/server/schema/tests");
  const { eq, and } = await import("drizzle-orm");
  const { QUESTIONS } = await import("../src/lib/data/questions");

  console.log("🚀 Starting database dimension remediation...");

  const targets = ["pss10", "gpius2", "srs"];

  for (const targetSlug of targets) {
    console.log(`\nProcessing ${targetSlug}...`);

    // Get test ID
    const [test] = await db.select().from(tests).where(eq(tests.slug, targetSlug)).limit(1);

    if (!test) {
      console.log(`⚠️ Test ${targetSlug} not found in DB. Skipping.`);
      continue;
    }

    const staticQuestions = QUESTIONS[targetSlug];
    if (!staticQuestions) {
      console.log(`⚠️ Static questions for ${targetSlug} not found. Skipping.`);
      continue;
    }

    let updateCount = 0;

    for (const sq of staticQuestions) {
      if (!sq.dimension) continue;

      const result = await db
        .update(questions)
        .set({ dimension: sq.dimension })
        .where(eq(questions.id, sq.id))
        .returning({ id: questions.id });

      if (result.length > 0) {
        updateCount++;
      } else {
        console.warn(`⚠️ Warning: Question ${sq.id} not found in DB.`);
      }
    }

    console.log(`✅ Updated ${updateCount} questions for ${targetSlug}.`);
  }

  console.log("\n🎉 Remediation complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error during remediation:", err);
  process.exit(1);
});
