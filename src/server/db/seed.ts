import { config } from "dotenv";
config({ path: ".env.local" });

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
  // Dynamic imports — must be after dotenv loads DATABASE_URL
  const { db } = await import("./index");
  const { tests, questions, options, resultInterpretations } = await import("../schema/tests");
  const { QUESTIONS } = await import("@/lib/data/questions");
  const { INTERPRETATIONS } = await import("@/lib/data/interpretations");
  const { eq, and, isNull } = await import("drizzle-orm");
  const { adminUsers } = await import("../schema/admin");
  const bcrypt = await import("bcryptjs");

  /**
   * Inline seed data — previously imported from TESTS.
   * Kept here as a self-contained reference for initial database population.
   */
  const TESTS = [
    {
      id: "srq29",
      name: "Self-Reporting Questionnaire (SRQ-29)",
      description:
        "Widely used in public health research, primary healthcare services, and mental health monitoring programs.",
      primaryCategory: "Mental Health",
      abbreviation: "SRQ-29",
      author: "WHO",
      releaseYear: 1994,
      color: "#9B8EC4",
      status: "Active",
    },
    {
      id: "pss10",
      name: "Perceived Stress Scale (PSS-10)",
      description:
        "Commonly used in psychological research, health studies, and clinical settings.",
      primaryCategory: "Stress",
      abbreviation: "PSS-10",
      author: "Cohen, Kamarck, & Mermelstein",
      releaseYear: 1983,
      color: "#6BA3BE",
      status: "Active",
    },
    {
      id: "gpius2",
      name: "Generalized Problematic Internet Use Scale 2 (GPIUS-2)",
      description:
        "Commonly used in psychological research and studies on internet addiction and digital behavior.",
      primaryCategory: "Internet & Technology",
      abbreviation: "GPIUS-2",
      author: "Caplan",
      releaseYear: 2010,
      color: "#D4A574",
      status: "Active",
    },
    {
      id: "srs",
      name: "Simplified Resilience Scale (SRS)",
      description:
        "A brief instrument measuring psychological resilience across diverse populations.",
      primaryCategory: "Resilience",
      abbreviation: "SRS",
      author: "Smith et al.",
      releaseYear: 2008,
      color: "#7DB4A0",
      status: "Active",
    },
  ];
  console.log("🌱 Starting Database Seed...");

  // ── Bootstrap super_admin ─────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log("\n🔐 Bootstrapping super_admin account...");
    const [existing] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, adminEmail))
      .limit(1);

    if (existing) {
      console.log(`  ✅ super_admin already exists (${adminEmail})`);
    } else {
      const hash = await bcrypt.hash(adminPassword, 12);
      await db.insert(adminUsers).values({
        email: adminEmail,
        name: "Super Admin",
        passwordHash: hash,
        role: "super_admin",
        isActive: true,
        mustChangePassword: true,
      });
      console.log(`  ✅ super_admin created: ${adminEmail} (must change password on first login)`);
    }
  } else {
    console.log("\n⚠️  ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin bootstrap.");
  }

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

      // Map static scoring method by slug (known at seed time)
      const scoringMethodMap: Record<string, "summative" | "dimensional" | "binary_cluster"> = {
        pss10: "summative",
        srs: "summative",
        gpius2: "dimensional",
        srq29: "binary_cluster",
        mbti: "dimensional",
      };

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
            abbreviation: testMeta.abbreviation ?? "",
            author: testMeta.author ?? null,
            releaseYear: testMeta.releaseYear ?? null,
            color: testMeta.color ?? "#9B8EC4",
            // 1D.7 lifecycle columns
            status: testMeta.status === "Active" ? "published" : "draft",
            scoringMethod: scoringMethodMap[testMeta.id] ?? "summative",
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
          const dimension =
            qData.dimension ?? (testMeta.id === "srq29" ? (SRQ29_DIMENSIONS[i] ?? null) : null);

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
