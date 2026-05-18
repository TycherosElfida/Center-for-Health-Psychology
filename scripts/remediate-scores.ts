import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/server/db/index");
  const { tests, questions, options: optionsTable } = await import("../src/server/schema/tests");
  const { answers, results } = await import("../src/server/schema/sessions");
  const { eq, inArray } = await import("drizzle-orm");
  const { computeScore } = await import("../src/server/scoring/engine");
  const { lookupInterpretation } = await import("../src/server/scoring/interpretation");

  console.log("🚀 Starting score remediation...");

  const targets = ["pss10", "gpius2", "srs"];

  for (const targetSlug of targets) {
    console.log(`\nProcessing ${targetSlug}...`);

    // Get test ID
    const [test] = await db.select().from(tests).where(eq(tests.slug, targetSlug)).limit(1);

    if (!test) {
      console.log(`⚠️ Test ${targetSlug} not found in DB. Skipping.`);
      continue;
    }

    // Get all results for this test
    const allResults = await db.select().from(results).where(eq(results.testId, test.id));
    console.log(`Found ${allResults.length} results for ${targetSlug}.`);

    if (allResults.length === 0) continue;

    // Load questions + options
    const testQs = await db.select().from(questions).where(eq(questions.testId, test.id));
    const questionIds = testQs.map((q) => q.id);
    const allOptions =
      questionIds.length > 0
        ? await db
            .select({ questionId: optionsTable.questionId, value: optionsTable.value })
            .from(optionsTable)
            .where(inArray(optionsTable.questionId, questionIds))
        : [];

    const optionsByQuestion = new Map<string, { value: number }[]>();
    for (const opt of allOptions) {
      const arr = optionsByQuestion.get(opt.questionId) ?? [];
      arr.push({ value: opt.value });
      optionsByQuestion.set(opt.questionId, arr);
    }

    const questionInput = testQs.map((q) => ({
      id: q.id,
      dimension: q.dimension,
      isReversed: q.isReversed,
      weight: Number(q.weight),
      options: optionsByQuestion.get(q.id) || [],
    }));

    let updateCount = 0;

    // Process each result
    for (const res of allResults) {
      // Load answers for the session
      const sessionAnswers = await db
        .select()
        .from(answers)
        .where(eq(answers.sessionId, res.sessionId));

      const answerMap: Record<string, unknown> = {};
      sessionAnswers.forEach((a) => {
        answerMap[a.questionId] = a.value;
      });

      // Compute score with updated dimensions
      const scoreResult = computeScore({
        answers: answerMap,
        questions: questionInput,
      });

      // Interpretation lookup (optional, but good for completeness)
      const dimensionInterpretations: Record<
        string,
        {
          label: string;
          description: string;
          recommendation: string | null;
          severity: string;
        }
      > = {};
      const hasDimensions = Object.keys(scoreResult.dimensionScores).length > 0;

      if (hasDimensions) {
        for (const [dimension, dimScore] of Object.entries(scoreResult.dimensionScores)) {
          const dimInterp = await lookupInterpretation(test.id, dimScore, dimension);
          if (dimInterp) {
            dimensionInterpretations[dimension] = dimInterp;
          }
        }
      }

      const interpretation = hasDimensions
        ? null
        : await lookupInterpretation(test.id, scoreResult.totalScore);

      const enrichedComputedScores = {
        ...scoreResult.computedScores,
        maxPossibleScore: scoreResult.maxPossibleScore,
        interpretation: interpretation
          ? {
              label: interpretation.label,
              description: interpretation.description,
              recommendation: interpretation.recommendation,
              severity: interpretation.severity,
            }
          : null,
        ...(Object.keys(dimensionInterpretations).length > 0 ? { dimensionInterpretations } : {}),
      };

      // Update the result record
      await db
        .update(results)
        .set({
          dimensionScores: scoreResult.dimensionScores,
          computedScores: enrichedComputedScores,
          // Re-update totalScore/rawScores just in case, though they shouldn't change
          totalScore: scoreResult.totalScore.toString(),
          rawScores: scoreResult.rawScores,
          resultLabel: interpretation?.label ?? null,
        })
        .where(eq(results.id, res.id));

      updateCount++;
    }

    console.log(`✅ Updated ${updateCount} results for ${targetSlug}.`);
  }

  console.log("\n🎉 Remediation complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error during remediation:", err);
  process.exit(1);
});
