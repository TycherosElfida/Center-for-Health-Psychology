import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./index";
import { tests, questions, options } from "../schema/tests";
import { TESTS } from "@/lib/data/tests";
import { QUESTIONS } from "@/lib/data/questions";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Starting Database Seed...");

  try {
    for (const testMeta of TESTS) {
      console.log(`Inserting test: ${testMeta.name}`);

      // Upsert the test
      let testId: string;
      const [existingTest] = await db
        .select()
        .from(tests)
        .where(eq(tests.slug, testMeta.id))
        .limit(1);

      if (existingTest) {
        testId = existingTest.id;
        console.log(`  Test already exists with ID: ${testId}`);
      } else {
        const [inserted] = await db
          .insert(tests)
          .values({
            slug: testMeta.id, // e.g., 'pss10'
            title: testMeta.name,
            description: testMeta.description,
            category: testMeta.primaryCategory,
            estimatedMinutes: parseInt(testMeta.duration.split("–")[0] || "5", 10),
            isPublished: testMeta.status === "Active",
            version: 1,
          })
          .returning({ id: tests.id });
        if (!inserted) throw new Error(`Failed to insert test ${testMeta.id}`);
        testId = inserted.id;
        console.log(`  Inserted new test with ID: ${testId}`);
      }

      const qList = QUESTIONS[testMeta.id];
      if (!qList) {
        console.warn(`  No questions found for test slug: ${testMeta.id}`);
        continue;
      }

      console.log(`  Inserting ${qList.length} questions...`);

      for (let i = 0; i < qList.length; i++) {
        const qData = qList[i];
        if (!qData) continue;
        const qType: "likert_5" | "likert_7" | "multiple_choice" | "slider" | "multi_select" =
          qData.options.length === 5
            ? "likert_5"
            : qData.options.length === 7
              ? "likert_7"
              : "multiple_choice";

        // Check if question exists
        const [existingQ] = await db
          .select()
          .from(questions)
          .where(eq(questions.id, qData.id))
          .limit(1);

        if (!existingQ) {
          await db.insert(questions).values({
            id: qData.id,
            testId: testId,
            order: i + 1,
            questionText: qData.text,
            type: qType,
            dimension: null,
            isReversed: qData.reversed ?? false,
            weight: "1.00",
            required: true,
          });

          // Insert options directly
          const optionsData = qData.options.map((opt, j) => ({
            questionId: qData.id,
            order: j + 1,
            label: opt.label,
            value: opt.value,
          }));

          if (optionsData.length > 0) {
            await db.insert(options).values(optionsData);
          }
        }
      }
    }

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
