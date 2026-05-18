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
  const { tests, questions, options, resultInterpretations, testCitations } =
    await import("../schema/tests");
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
        "SRQ-29 adalah instrumen skrining kesehatan mental yang dikembangkan oleh World Health Organization (WHO) " +
        "untuk mendeteksi gangguan mental emosional di layanan kesehatan primer. Kuesioner ini terdiri dari 29 pertanyaan " +
        "yang mencakup empat domain utama: gejala neurotik (kecemasan dan depresi), penggunaan zat psikoaktif, gejala " +
        "psikotik, dan gejala gangguan stres pascatrauma (PTSD). SRQ-29 telah divalidasi secara luas di Indonesia melalui " +
        "Riset Kesehatan Dasar (Riskesdas) 2013 dan 2018 oleh Kementerian Kesehatan RI, dan digunakan sebagai alat skrining " +
        "standar dalam program kesehatan jiwa masyarakat. Instrumen ini bersifat skrining — bukan diagnostik — sehingga " +
        "hasil positif memerlukan evaluasi klinis lanjutan oleh profesional kesehatan mental.",
      instructions:
        "Bacalah setiap pertanyaan berikut dengan cermat. Pertanyaan-pertanyaan ini berkaitan dengan kondisi dan " +
        'perasaan yang mungkin kamu alami selama 30 hari terakhir. Jawablah setiap pertanyaan dengan "Ya" atau "Tidak" ' +
        "sesuai dengan pengalaman kamu. Tidak ada jawaban benar atau salah — jawablah sejujur mungkin. " +
        "Jika kamu merasa ragu, pilihlah jawaban yang paling mendekati perasaan kamu. " +
        "Semua jawaban bersifat rahasia dan hanya digunakan untuk keperluan asesmen kesehatan mental.",
      primaryCategory: "Kesehatan Mental",
      abbreviation: "SRQ-29",
      author: "World Health Organization (WHO)",
      releaseYear: 1994,
      color: "#9B8EC4",
      status: "Active",
    },
    {
      id: "pss10",
      name: "Perceived Stress Scale (PSS-10)",
      description:
        "PSS-10 adalah instrumen pengukuran tingkat stres yang dirasakan (perceived stress) yang dikembangkan oleh " +
        "Sheldon Cohen, Tom Kamarck, dan Robin Mermelstein pada tahun 1983. Skala ini mengukur sejauh mana situasi " +
        "dalam kehidupan seseorang dinilai sebagai sesuatu yang penuh tekanan (stressful), tidak terduga, dan di luar " +
        "kendali selama satu bulan terakhir. PSS-10 terdiri dari 10 pertanyaan dengan format respons skala Likert " +
        "5 pilihan (0–4), di mana 4 item bersifat positif (reversed scoring) dan 6 item bersifat negatif. " +
        "Instrumen ini telah divalidasi secara internasional dan digunakan secara luas dalam penelitian psikologi, " +
        "kesehatan masyarakat, dan praktik klinis. Total skor berkisar antara 0–40, dengan skor yang lebih tinggi " +
        "menunjukkan tingkat stres yang lebih besar.",
      instructions:
        "Pada setiap pertanyaan berikut, kamu akan ditanya tentang perasaan dan pikiran kamu selama satu bulan " +
        "terakhir. Untuk setiap pertanyaan, pilihlah jawaban yang paling menggambarkan seberapa sering kamu merasakan " +
        "atau berpikir demikian. Gunakan skala berikut: 0 = Tidak Pernah, 1 = Hampir Tidak Pernah, 2 = Kadang-kadang, " +
        "3 = Cukup Sering, 4 = Sangat Sering. Jawablah dengan cepat dan jujur — jangan terlalu lama memikirkan satu " +
        "pertanyaan. Tidak ada jawaban benar atau salah.",
      primaryCategory: "Stres",
      abbreviation: "PSS-10",
      author: "Sheldon Cohen, Tom Kamarck & Robin Mermelstein",
      releaseYear: 1983,
      color: "#6BA3BE",
      status: "Active",
    },
    {
      id: "gpius2",
      name: "Generalized Problematic Internet Use Scale 2 (GPIUS-2)",
      description:
        "GPIUS-2 adalah instrumen psikometrik yang dikembangkan oleh Scott E. Caplan pada tahun 2010 untuk mengukur " +
        "penggunaan internet bermasalah secara umum (Generalized Problematic Internet Use). Versi yang digunakan pada " +
        "platform ini merupakan adaptasi Bahasa Indonesia oleh Reynaldo dan Sokang (2016) dari Universitas Kristen " +
        "Krida Wacana (UKRIDA). Instrumen ini berdasarkan model kognitif-perilaku yang mengidentifikasi faktor-faktor " +
        "psikologis yang berkontribusi pada penggunaan internet yang berlebihan atau merugikan. GPIUS-2 terdiri dari " +
        "15 pertanyaan yang mencakup lima dimensi: Preferensi untuk Interaksi Sosial Online (POSI), Regulasi Suasana " +
        "Hati (Mood Regulation), Preokupasi Kognitif (Cognitive Preoccupation), Penggunaan Kompulsif (Compulsive Use), " +
        "dan Konsekuensi Negatif (Negative Outcomes). Skala ini menggunakan format Likert 5 poin (1–5) sesuai adaptasi " +
        "Indonesia dan telah digunakan secara luas dalam penelitian tentang kecanduan internet dan kesejahteraan digital.",
      instructions:
        "Bacalah setiap pernyataan berikut dengan cermat. Setiap pernyataan menggambarkan pengalaman atau perasaan " +
        "yang mungkin kamu alami terkait penggunaan internet dalam kehidupan sehari-hari. Pilihlah angka dari 1 hingga 5 " +
        "yang paling menggambarkan seberapa setuju kamu dengan pernyataan tersebut: 1 = Sangat Tidak Setuju, " +
        "2 = Tidak Setuju, 3 = Netral, 4 = Setuju, 5 = Sangat Setuju. Jawablah berdasarkan pengalaman kamu secara " +
        "umum, bukan hanya kejadian tertentu. Tidak ada jawaban benar atau salah — yang terpenting adalah kejujuran kamu.",
      primaryCategory: "Internet & Teknologi",
      abbreviation: "GPIUS-2",
      author: "Scott E. Caplan",
      releaseYear: 2010,
      color: "#D4A574",
      status: "Active",
    },
    {
      id: "srs",
      name: "Simplified Resilience Scale (SRS)",
      description:
        "SRS (Simplified Resilience Score) adalah instrumen singkat yang mengukur tingkat resiliensi psikologis — " +
        "yaitu kemampuan seseorang untuk bangkit kembali (bounce back) dari situasi sulit, stres, atau tekanan " +
        "dalam kehidupan. Dikembangkan oleh Manning, Carr, dan Kail (2016) berdasarkan item-item dari Satisfaction " +
        "With Life Scale (Diener et al., 1985) dan Pearlin Mastery Scale (Pearlin & Schooler, 1978). Versi adaptasi " +
        "Indonesia yang digunakan pada platform ini terdiri dari 11 pertanyaan dengan format Likert 6 poin (1–6). " +
        "SRS mencakup tiga subskala: Efikasi (Efficacy), Kepuasan (Satisfaction), dan Kontrol (Control). Skor total " +
        "berkisar antara 11–66 dengan skor lebih tinggi menunjukkan resiliensi yang lebih baik. Instrumen ini cocok " +
        "untuk populasi umum dan mahasiswa karena pengisiannya yang cepat dan mudah dipahami.",
      instructions:
        "Bacalah setiap pernyataan berikut dan tentukan seberapa jauh pernyataan tersebut menggambarkan diri kamu " +
        "saat ini. Gunakan skala berikut: 1 = Sangat Tidak Setuju, 2 = Tidak Setuju, 3 = Agak Tidak Setuju, " +
        "4 = Agak Setuju, 5 = Setuju, 6 = Sangat Setuju. Jawablah setiap pernyataan dengan jujur berdasarkan " +
        "bagaimana kamu biasanya merespons situasi yang menantang atau menekan dalam hidup kamu. " +
        "Tidak ada jawaban benar atau salah.",
      primaryCategory: "Resiliensi",
      abbreviation: "SRS",
      author: "Lydia K. Manning, Dawn C. Carr, & Ben Lennox Kail",
      releaseYear: 2016,
      color: "#7DB4A0",
      status: "Active",
    },
  ];
  console.log("🌱 Starting Database Seed...\n");

  // ── Bootstrap super_admin ─────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log("🔐 Bootstrapping super_admin account...");
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
    console.log("⚠️  ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin bootstrap.");
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
        // Always sync metadata on re-seed (description, instructions, author, etc.)
        await db
          .update(tests)
          .set({
            title: testMeta.name,
            description: testMeta.description,
            instructions: testMeta.instructions,
            category: testMeta.primaryCategory,
            abbreviation: testMeta.abbreviation ?? "",
            author: testMeta.author ?? null,
            releaseYear: testMeta.releaseYear ?? null,
            color: testMeta.color ?? "#9B8EC4",
            scoringMethod: scoringMethodMap[testMeta.id] ?? "summative",
            updatedAt: new Date(),
          })
          .where(eq(tests.id, testId));
        console.log(`  ✅ Test updated with enriched metadata: ${testId}`);
      } else {
        const [inserted] = await db
          .insert(tests)
          .values({
            slug: testMeta.id, // e.g., 'pss10'
            title: testMeta.name,
            description: testMeta.description,
            instructions: testMeta.instructions,
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

    // ── Purge stale interpretation rows ──────────────────────────
    // Required when interpretation structure changes (new dimensions,
    // corrected thresholds). The old rows have different minScore/maxScore
    // values that the idempotency check below won't match.
    const srq29TestId = slugToId.get("srq29");
    if (srq29TestId) {
      const purged = await db
        .delete(resultInterpretations)
        .where(eq(resultInterpretations.testId, srq29TestId));
      console.log(`  🧹 Purged stale SRQ-29 interpretations (${purged.rowCount ?? 0} rows)`);
    }

    const pss10TestId = slugToId.get("pss10");
    if (pss10TestId) {
      const purged = await db
        .delete(resultInterpretations)
        .where(eq(resultInterpretations.testId, pss10TestId));
      console.log(`  🧹 Purged stale PSS-10 interpretations (${purged.rowCount ?? 0} rows)`);
    }

    const gpius2TestId = slugToId.get("gpius2");
    if (gpius2TestId) {
      const purged = await db
        .delete(resultInterpretations)
        .where(eq(resultInterpretations.testId, gpius2TestId));
      console.log(`  🧹 Purged stale GPIUS-2 interpretations (${purged.rowCount ?? 0} rows)`);
    }

    const srsTestId = slugToId.get("srs");
    if (srsTestId) {
      const purged = await db
        .delete(resultInterpretations)
        .where(eq(resultInterpretations.testId, srsTestId));
      console.log(`  🧹 Purged stale SRS interpretations (${purged.rowCount ?? 0} rows)`);
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

    // ── Seed test_citations ─────────────────────────────────────
    console.log("\n📚 Seeding test_citations...");

    const CITATIONS = [
      // ── SRQ-29 Citations ──
      {
        slug: "srq29",
        type: "original_instrument",
        citation:
          "Harding, T. W., de Arango, M. V., Baltazar, J., dkk. (1980). Mental disorders in primary health care: A study of their frequency and diagnosis in four developing countries. Psychological Medicine, 10(2), 231–241.",
        doi: "10.1017/S0033291700043993",
        year: 1980,
        url: null,
      },
      {
        slug: "srq29",
        type: "original_instrument",
        citation:
          "Beusenberg, M., & Orley, J. (WHO). (1994). A User's Guide to the Self-Reporting Questionnaire (SRQ). World Health Organization, Geneva.",
        doi: null,
        year: 1994,
        url: "https://apps.who.int/iris/handle/10665/61113",
      },
      {
        slug: "srq29",
        type: "indonesian_adaptation",
        citation:
          "Kementerian Kesehatan RI. (2018). Riset Kesehatan Dasar (RISKESDAS) — Adaptasi SRQ-29 Indonesia. Badan Litbangkes, Kemenkes RI.",
        doi: null,
        year: 2018,
        url: null,
      },
      {
        slug: "srq29",
        type: "validation_norms",
        citation:
          "Idaiani, S., Mubasyiroh, R., Suryaputri, I. Y., Indrawati, L., & Dharmayanti, I. (2022). The validity of the self-reporting questionnaire-20 for symptoms of depression: A sub-analysis of the national health survey in Indonesia. Open Access Macedonian Journal of Medical Sciences, 10(E).",
        doi: "10.3889/oamjms.2022.9999",
        year: 2022,
        url: null,
      },
      // ── PSS-10 Citations ──
      {
        slug: "pss10",
        type: "original_instrument",
        citation:
          "Cohen, S., Kamarck, T., & Mermelstein, R. (1983). A global measure of perceived stress. Journal of Health and Social Behavior, 24(4), 385–396.",
        doi: "10.2307/2136404",
        year: 1983,
        url: null,
      },
      {
        slug: "pss10",
        type: "validation_norms",
        citation:
          "Cohen, S., & Williamson, G. M. (1988). Perceived stress in a probability sample of the United States. In S. Spacapan & S. Oskamp (Eds.), The social psychology of health (pp. 31–67). Sage Publications.",
        doi: null,
        year: 1988,
        url: null,
      },
      {
        slug: "pss10",
        type: "psychometric_review",
        citation:
          "Lee, E.-H. (2012). Review of the psychometric evidence of the Perceived Stress Scale. Asian Nursing Research, 6(4), 121–127.",
        doi: "10.1016/j.anr.2012.08.004",
        year: 2012,
        url: null,
      },
      {
        slug: "pss10",
        type: "indonesian_adaptation",
        citation:
          "Pratiwi, A., Sutrisno, J., & Wibowo, A. P. (2024). Psychometric properties of the Perceived Stress Scale (PSS-10) in Indonesian version. JP3I (Jurnal Pengukuran Psikologi dan Pendidikan Indonesia), 13(2), 117–129.",
        doi: "10.15408/jp3i.v13i2.35482",
        year: 2024,
        url: null,
      },
      {
        slug: "pss10",
        type: "psychometric_review",
        citation:
          "Roberti, J. W., Harrington, L. N., & Storch, E. A. (2006). Further psychometric support for the 10-item version of the Perceived Stress Scale. Journal of College Counseling, 9(2), 135–147.",
        doi: "10.1002/j.2161-1882.2006.tb00100.x",
        year: 2006,
        url: null,
      },
      // ── GPIUS-2 Citations ──
      {
        slug: "gpius2",
        type: "original_instrument",
        citation:
          "Caplan, S. E. (2010). Theory and measurement of generalized problematic Internet use: A two-step approach. Computers in Human Behavior, 26(5), 1089–1097.",
        doi: "10.1016/j.chb.2010.03.012",
        year: 2010,
        url: null,
      },
      {
        slug: "gpius2",
        type: "validation_norms",
        citation:
          "Caplan, S. E. (2002). Problematic Internet use and psychosocial well-being: Development of a theory-based cognitive-behavioral measurement instrument. Computers in Human Behavior, 18(5), 553–575.",
        doi: "10.1016/S0747-5632(02)00004-3",
        year: 2002,
        url: null,
      },
      {
        slug: "gpius2",
        type: "indonesian_adaptation",
        citation:
          "Reynaldo, R., & Sokang, Y. A. (2016). Mahasiswa dan internet: Dua sisi mata uang? Problematic internet use pada mahasiswa. Jurnal Psikologi (Universitas Gadjah Mada), 43(2), 107–120.",
        doi: "10.22146/jpsi.17276",
        year: 2016,
        url: null,
      },
      // ── SRS Citations ──
      {
        slug: "srs",
        type: "original_instrument",
        citation:
          "Manning, L. K., Carr, D. C., & Kail, B. L. (2016). Do higher levels of resilience buffer the deleterious impact of chronic illness on disability in later life? The Gerontologist, 56(3), 514–524.",
        doi: "10.1093/geront/gnu068",
        year: 2016,
        url: null,
      },
      {
        slug: "srs",
        type: "source_instrument",
        citation:
          "Diener, E., Emmons, R. A., Larsen, R. J., & Griffin, S. (1985). The Satisfaction With Life Scale. Journal of Personality Assessment, 49(1), 71–75.",
        doi: "10.1207/s15327752jpa4901_13",
        year: 1985,
        url: null,
      },
      {
        slug: "srs",
        type: "source_instrument",
        citation:
          "Pearlin, L. I., & Schooler, C. (1978). The structure of coping. Journal of Health and Social Behavior, 19(1), 2–21.",
        doi: "10.2307/2136319",
        year: 1978,
        url: null,
      },
    ];

    let citInserted = 0;
    let citSkipped = 0;

    for (const cit of CITATIONS) {
      const testId = slugToId.get(cit.slug);
      if (!testId) continue;

      // Idempotency: check by testId + type + year
      const [existing] = await db
        .select({ id: testCitations.id })
        .from(testCitations)
        .where(
          and(
            eq(testCitations.testId, testId),
            eq(testCitations.type, cit.type),
            eq(testCitations.citation, cit.citation)
          )
        )
        .limit(1);

      if (existing) {
        citSkipped++;
        continue;
      }

      await db.insert(testCitations).values({
        testId,
        type: cit.type,
        citation: cit.citation,
        doi: cit.doi,
        year: cit.year,
        url: cit.url,
      });
      citInserted++;
    }

    console.log(`  ✅ Citations: ${citInserted} inserted, ${citSkipped} skipped (already exist)`);

    console.log("\n✅ Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
