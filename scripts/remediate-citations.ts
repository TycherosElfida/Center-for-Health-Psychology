/**
 * Remediation script for backfilling clinical citations
 * Per 2026-05-08-scoring-engine-clinical-references-design.md
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const CITATIONS = [
  // PSS-10
  {
    testSlug: "pss10",
    citations: [
      {
        type: "foundational",
        citation:
          "Cohen, S., Kamarck, T., & Mermelstein, R. (1983). A global measure of perceived stress. Journal of Health and Social Behavior, 24(4), 385–396.",
        year: 1983,
      },
      {
        type: "foundational",
        citation:
          "Cohen, S., & Williamson, G. (1988). Perceived stress in a probability sample of the United States. In S. Spacapam & S. Oskamp (Eds.), The social psychology of health. Sage.",
        year: 1988,
      },
      {
        type: "indonesian_validation",
        citation:
          "Pratiwi, A., Sutrisno, J., & Wibowo, A. P. (2024). Psychometric properties of the Perceived Stress Scale (PSS-10) in Indonesian version. JP3I, 13(2), 117–129.",
        year: 2024,
      },
    ],
  },
  // GPIUS-2
  {
    testSlug: "gpius2",
    citations: [
      {
        type: "foundational",
        citation:
          "Caplan, S. E. (2010). Theory and measurement of generalized problematic Internet use: A two-step approach. Computers in Human Behavior, 26(5), 1089–1097.",
        year: 2010,
      },
      {
        type: "indonesian_validation",
        citation:
          "Reynaldo, R., & Sokang, Y. A. (2016). Mahasiswa dan internet: Dua sisi mata uang? Problematic internet use pada mahasiswa. Jurnal Psikologi (UGM), 43(2), 107–120.",
        year: 2016,
      },
    ],
  },
  // SRS
  {
    testSlug: "srs",
    citations: [
      {
        type: "foundational",
        citation:
          "Manning, L. K., Carr, D. C., & Kail, B. L. (2016). Do higher levels of resilience buffer the deleterious impact of chronic illness on disability in later life? The Gerontologist, 56(3), 514–524.",
        year: 2016,
      },
      {
        type: "source_instrument",
        citation:
          "Diener, E., Emmons, R. A., Larsen, R. J., & Griffin, S. (1985). The Satisfaction With Life Scale. Journal of Personality Assessment, 49(1), 71–75.",
        year: 1985,
      },
      {
        type: "source_instrument",
        citation:
          "Pearlin, L. I., & Schooler, C. (1978). The structure of coping. Journal of Health and Social Behavior, 19(1), 2–21.",
        year: 1978,
      },
    ],
  },
  // SRQ-29
  {
    testSlug: "srq29",
    citations: [
      {
        type: "foundational",
        citation:
          "Harding, T. W., et al. (1980). Mental disorders in primary health care. Psychological Medicine, 10(2), 231–241.",
        year: 1980,
      },
      {
        type: "foundational",
        citation:
          "Beusenberg, M., & Orley, J. (1994). A User's Guide to the Self-Reporting Questionnaire (SRQ). Geneva: World Health Organization.",
        year: 1994,
      },
      {
        type: "indonesian_validation",
        citation:
          "Kementerian Kesehatan Republik Indonesia. (2018). Laporan Nasional RISKESDAS 2018. Jakarta.",
        year: 2018,
      },
      {
        type: "indonesian_validation",
        citation:
          "Idaiani, S., et al. (2022). The validity of the self-reporting questionnaire-20 for symptoms of depression. Open Access Macedonian Journal of Medical Sciences, 10(E).",
        year: 2022,
      },
    ],
  },
];

async function run() {
  const { db } = await import("../src/server/db/index");
  const { tests, testCitations } = await import("../src/server/schema/tests");
  const { eq, and } = await import("drizzle-orm");

  console.log("🚀 Starting citation remediation...");

  for (const testData of CITATIONS) {
    const [test] = await db
      .select({ id: tests.id })
      .from(tests)
      .where(eq(tests.slug, testData.testSlug));

    if (!test) {
      console.warn(`⚠️ Test ${testData.testSlug} not found in DB.`);
      continue;
    }

    console.log(`\n📚 Processing citations for ${testData.testSlug} (ID: ${test.id})`);

    let inserted = 0;
    let skipped = 0;

    for (const citationData of testData.citations) {
      // Check if citation exists
      const [existing] = await db
        .select({ id: testCitations.id })
        .from(testCitations)
        .where(
          and(eq(testCitations.testId, test.id), eq(testCitations.citation, citationData.citation))
        );

      if (existing) {
        skipped++;
        continue;
      }

      await db.insert(testCitations).values({
        testId: test.id,
        type: citationData.type,
        citation: citationData.citation,
        year: citationData.year,
      });
      inserted++;
    }

    console.log(`  ✅ Inserted: ${inserted}, Skipped: ${skipped}`);
  }

  console.log("\n🎉 Citation remediation complete!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Remediation failed:", err);
  process.exit(1);
});
