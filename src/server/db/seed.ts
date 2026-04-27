import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./index";
import { tests, questions, options, resultInterpretations } from "../schema/tests";
import { TESTS } from "@/lib/data/tests";
import { QUESTIONS } from "@/lib/data/questions";
import { INTERPRETATIONS } from "@/lib/data/interpretations";
import { eq, and, isNull } from "drizzle-orm";

/** SRQ-29 dimension assignment by question index (0-based) */
const SRQ29_DIMENSIONS: Record<number, string> = {
  // Q1-Q20 (indices 0-19): Neurotic / Anxiety-Depression
  ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, "neurotic"])),
  // Q21 (index 20): Substance Use
  20: "substance",
  // Q22-Q24 (indices 21-23): Psychotic Symptoms
  21: "psychotic",
  22: "psychotic",
  23: "psychotic",
  // Q25-Q29 (indices 24-28): PTSD Symptoms
  24: "ptsd",
  25: "ptsd",
  26: "ptsd",
  27: "ptsd",
  28: "ptsd",
};

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
          const dimension = testMeta.id === "srq29" ? (SRQ29_DIMENSIONS[i] ?? null) : null;

          await db.insert(questions).values({
            id: qData.id,
            testId: testId,
            order: i + 1,
            questionText: qData.text,
            type: qType,
            dimension: dimension,
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

    // ── Seed result_interpretations ───────────────────────────
    console.log("\n🧠 Seeding result_interpretations...");

    // Build a slug → testId map from what we just seeded/found
    const slugToId = new Map<string, string>();
    for (const testMeta of TESTS) {
      const [row] = await db
        .select({ id: tests.id })
        .from(tests)
        .where(eq(tests.slug, testMeta.id))
        .limit(1);
      if (row) slugToId.set(testMeta.id, row.id);
    }

    let inserted = 0;
    let skipped = 0;

    for (const interp of INTERPRETATIONS) {
      const testId = slugToId.get(interp.testSlug);
      if (!testId) {
        throw new Error(
          `Cannot seed interpretation: test slug "${interp.testSlug}" not found in DB`
        );
      }

      // Idempotency: composite uniqueness check (testId, dimension, minScore, maxScore)
      const dimensionCheck =
        interp.dimension === null
          ? isNull(resultInterpretations.dimension)
          : eq(resultInterpretations.dimension, interp.dimension);

      const [existing] = await db
        .select({ id: resultInterpretations.id })
        .from(resultInterpretations)
        .where(
          and(
            eq(resultInterpretations.testId, testId),
            dimensionCheck,
            eq(resultInterpretations.minScore, interp.minScore),
            eq(resultInterpretations.maxScore, interp.maxScore)
          )
        )
        .limit(1);

      if (existing) {
        skipped++;
        continue;
      }

      await db.insert(resultInterpretations).values({
        testId,
        dimension: interp.dimension,
        minScore: interp.minScore,
        maxScore: interp.maxScore,
        label: interp.label,
        description: interp.description,
        recommendation: interp.recommendation,
        severity: interp.severity,
        version: interp.version,
      });
      inserted++;
    }

    console.log(`  ✅ Interpretations: ${inserted} inserted, ${skipped} skipped (already exist)`);

    console.log("\n✅ Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
