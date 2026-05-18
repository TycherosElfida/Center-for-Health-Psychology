/**
 * T0.4 — Result Interpretation Seed Data
 *
 * Clinically grounded score-range → label → recommendation → severity
 * mappings for PSS-10, GPIUS-2, SRS, and SRQ-29.
 *
 * Sources:
 *   - PSS-10: Cohen et al. (1983/1994) — Low ≤13, Moderate 14–26, High 27–40
 *            + Helplessness (0–24) and Self-Efficacy (0–16) per-dimension interpretations
 *   - GPIUS-2: Caplan (2010); Reynaldo & Sokang (2016) — Normal ≤34, Mild 35–52, Severe 53–75
 *   - SRS: Manning et al. (2016); Schwarzer et al. (1999) — Low 11–33, Moderate 34–50, High 51–66
 *
 * SRS uses INVERTED polarity: low score → severity "high", high score → severity "low".
 *
 * This module is a pure data file — no framework directives, no DB imports.
 * The seed script resolves testSlug → testId at runtime.
 *
 * NOTE: minScore/maxScore are strings to match Drizzle's `numeric` column type.
 * NOTE: dimension is `null` for total-score-only instruments.
 * NOTE: SRQ-29 uses per-dimension interpretation (neurotic, substance, psychotic, ptsd).
 */

export interface InterpretationSeed {
  /** Test slug used to resolve the UUID testId at seed time */
  testSlug: string;
  /** Dimension — null for summative total-score instruments, string for dimensional */
  dimension: string | null;
  /** Minimum score (inclusive) — string for Drizzle numeric */
  minScore: string;
  /** Maximum score (inclusive) — string for Drizzle numeric */
  maxScore: string;
  /** Human-readable label (Indonesian) */
  label: string;
  /** Detailed description (Indonesian) */
  description: string;
  /** Actionable recommendation (Indonesian), nullable */
  recommendation: string | null;
  /** Severity level — must match severityEnum */
  severity: "low" | "moderate" | "high" | "critical";
  /** Schema version for future migrations */
  version: number;
}

export const INTERPRETATIONS: InterpretationSeed[] = [
  // ── PSS-10 (Total Score Range: 0–40) ───────────────────────
  // Total-score interpretations (dimension = null)
  {
    testSlug: "pss10",
    dimension: null,
    minScore: "0.00",
    maxScore: "13.00",
    label: "Stres Rendah",
    description:
      "Tingkat stres yang kamu rasakan saat ini termasuk rendah. Kamu tampaknya mampu mengelola tuntutan dan tekanan kehidupan sehari-hari dengan baik. Persepsi terhadap situasi hidup secara umum tidak dirasakan sebagai sesuatu yang tidak terkendali atau berlebihan.",
    recommendation:
      "Pertahankan pola hidup sehat yang sudah berjalan: tidur cukup (7–9 jam), aktivitas fisik rutin, dan luangkan waktu untuk kegiatan yang menyenangkan. Lanjutkan strategi coping yang sudah efektif.",
    severity: "low",
    version: 1,
  },
  {
    testSlug: "pss10",
    dimension: null,
    minScore: "14.00",
    maxScore: "26.00",
    label: "Stres Sedang",
    description:
      "Tingkat stres yang kamu rasakan saat ini termasuk sedang. Ini merupakan rentang yang umum dialami oleh kebanyakan orang dewasa. Meskipun masih dalam batas yang bisa dikelola, kamu mungkin mulai merasakan bahwa beberapa aspek kehidupan terasa sulit dikendalikan atau membebani.",
    recommendation:
      "Pertimbangkan untuk menerapkan teknik pengelolaan stres secara rutin, seperti latihan pernapasan dalam, meditasi mindfulness, atau journaling. Jika stres mulai mengganggu aktivitas sehari-hari, berkonsultasilah dengan psikolog atau konselor.",
    severity: "moderate",
    version: 1,
  },
  {
    testSlug: "pss10",
    dimension: null,
    minScore: "27.00",
    maxScore: "40.00",
    label: "Stres Tinggi",
    description:
      "Tingkat stres yang kamu rasakan saat ini termasuk tinggi. Kamu mungkin merasa bahwa banyak hal dalam hidup terasa di luar kendali, tidak terduga, dan membebani. Kondisi ini dapat berdampak pada kesehatan fisik, emosional, dan produktivitas jika tidak ditangani.",
    recommendation:
      "Sangat disarankan untuk segera berkonsultasi dengan psikolog atau konselor profesional. Prioritaskan istirahat yang cukup, batasi tanggung jawab yang bisa didelegasikan, dan hindari keputusan besar dalam kondisi stres tinggi. Libatkan orang terdekat untuk dukungan sosial.",
    severity: "high",
    version: 1,
  },

  // Per-dimension: Helplessness (Q1,2,3,6,9,10 — 6 items × 0–4 = 0–24)
  {
    testSlug: "pss10",
    dimension: "Helplessness",
    minScore: "0.00",
    maxScore: "8.00",
    label: "Ketidakberdayaan Rendah",
    description:
      "Kamu jarang merasa kewalahan atau kehilangan kendali atas situasi kehidupan. Peristiwa-peristiwa yang terjadi tidak kamu persepsikan sebagai sesuatu yang mengancam atau tidak bisa diatasi.",
    recommendation: "Pertahankan pola pikir positif dan strategi coping yang sudah berjalan baik.",
    severity: "low",
    version: 1,
  },
  {
    testSlug: "pss10",
    dimension: "Helplessness",
    minScore: "9.00",
    maxScore: "16.00",
    label: "Ketidakberdayaan Sedang",
    description:
      "Kamu kadang-kadang merasa bahwa tuntutan hidup sulit dikendalikan. Ada perasaan tidak berdaya menghadapi situasi tertentu, terutama yang tidak terduga.",
    recommendation:
      "Identifikasi situasi spesifik yang memicu perasaan tidak berdaya. Cobalah teknik problem-solving terstruktur dan latihan mindfulness.",
    severity: "moderate",
    version: 1,
  },
  {
    testSlug: "pss10",
    dimension: "Helplessness",
    minScore: "17.00",
    maxScore: "24.00",
    label: "Ketidakberdayaan Tinggi",
    description:
      "Kamu sering merasa kewalahan, tidak mampu mengendalikan hal-hal penting, dan merasa kesulitan menumpuk. Perasaan ini dapat berkontribusi pada kelelahan emosional.",
    recommendation:
      "Konsultasikan perasaan ini dengan psikolog. Teknik cognitive-behavioral therapy (CBT) dapat membantu mengubah pola pikir yang tidak adaptif.",
    severity: "high",
    version: 1,
  },

  // Per-dimension: Self-Efficacy (Q4,5,7,8 — 4 items × 0–4 = 0–16, reverse-scored)
  // NOTE: After reverse-scoring, higher Self-Efficacy score = LOWER actual self-efficacy
  {
    testSlug: "pss10",
    dimension: "Self-Efficacy",
    minScore: "0.00",
    maxScore: "5.00",
    label: "Efikasi Diri Tinggi",
    description:
      "Kamu memiliki keyakinan yang kuat terhadap kemampuan diri sendiri dalam mengatasi masalah pribadi dan mengendalikan situasi. Kamu merasa mampu menguasai keadaan.",
    recommendation:
      "Pertahankan rasa percaya diri ini. Gunakan pengalaman positif sebagai modal untuk menghadapi tantangan baru.",
    severity: "low",
    version: 1,
  },
  {
    testSlug: "pss10",
    dimension: "Self-Efficacy",
    minScore: "6.00",
    maxScore: "10.00",
    label: "Efikasi Diri Sedang",
    description:
      "Keyakinan terhadap kemampuan diri untuk mengatasi masalah dan mengendalikan situasi berada pada tingkat sedang. Kadang kamu merasa yakin, kadang ragu.",
    recommendation:
      "Refleksikan pengalaman-pengalaman di mana kamu berhasil mengatasi masalah. Catat pencapaian kecil untuk membangun kepercayaan diri.",
    severity: "moderate",
    version: 1,
  },
  {
    testSlug: "pss10",
    dimension: "Self-Efficacy",
    minScore: "11.00",
    maxScore: "16.00",
    label: "Efikasi Diri Rendah",
    description:
      "Kamu kurang yakin terhadap kemampuan diri untuk mengatasi masalah pribadi dan merasa sulit mengendalikan hal-hal dalam hidup. Rendahnya efikasi diri dapat memperkuat persepsi stres.",
    recommendation:
      "Pertimbangkan untuk berkonsultasi dengan psikolog. Latihan penguatan efikasi diri (self-efficacy building) melalui pencapaian bertahap dapat sangat membantu.",
    severity: "high",
    version: 1,
  },

  // ── GPIUS-2 (Total Score Range: 15–75) ─────────────────────────
  // Three-band scheme anchored to Reynaldo & Sokang (2016) Jakarta student
  // sample mean (N=474, M_total=43.41). Bands: below mean / near mean /
  // above mean. Non-diagnostic screening indicators only — not clinical
  // diagnoses. Labels use "indikasi" throughout to preserve non-diagnostic
  // framing per clinical audit requirement.
  //
  // CUTOFF SOURCE: Reynaldo, R. & Sokang, Y.A. (2016). Internet Addiction,
  // Can You Be Trapped? Adaptation of Generalized Problematic Internet Use
  // Scale 2 for Indonesian Adolescents. Makara Hubs-Asia, 20(1), 59–68.
  // doi:10.7454/mssh.v20i1.3498
  {
    testSlug: "gpius2",
    dimension: null,
    minScore: "15.00",
    maxScore: "43.00",
    label: "Penggunaan Internet Normal",
    description:
      "Pola penggunaan internetmu berada di bawah rata-rata sampel mahasiswa Jakarta (R&S 2016, M=43.41). Tidak ditemukan indikasi signifikan penggunaan internet yang bermasalah.",
    recommendation:
      "Pertahankan kebiasaan digital yang sehat. Tetap perhatikan waktu yang dihabiskan online dan pastikan aktivitas digital tidak mengganggu kehidupan sehari-hari.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: null,
    minScore: "44.00",
    maxScore: "58.00",
    label: "Indikasi Penggunaan Internet Bermasalah Ringan",
    description:
      "Skor totalmu berada di atas rata-rata sampel rujukan (M=43.41). Terdapat beberapa indikasi penggunaan internet yang kurang sehat pada satu atau lebih dimensi.",
    recommendation:
      "Pantau waktu penggunaan internet dan tetapkan jadwal 'offline'. Perhatikan dimensi mana yang paling tinggi pada profil subskala di bawah, dan mulai dari sana.",
    severity: "moderate" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: null,
    minScore: "59.00",
    maxScore: "75.00",
    label: "Indikasi Penggunaan Internet Bermasalah Tinggi",
    description:
      "Skor totalmu jauh di atas rata-rata sampel rujukan (M=43.41). Pola penggunaan internet menunjukkan indikasi dampak signifikan terhadap kehidupan sehari-hari.",
    recommendation:
      "Sangat disarankan untuk berkonsultasi dengan psikolog yang berpengalaman dalam isu perilaku digital. Lihat profil subskala di bawah untuk memahami area yang paling membutuhkan perhatian.",
    severity: "high" as const,
    version: 1,
  },

  // ── GPIUS-2 Subscale: POSI — Preferensi Interaksi Sosial Online ─
  // Scale 3–15, R&S 2016 M=7.26. Bands: 3–7 / 8–11 / 12–15.
  // POSI: prefers online over face-to-face social interaction.
  {
    testSlug: "gpius2",
    dimension: "POSI",
    minScore: "3.00",
    maxScore: "7.00",
    label: "POSI: Preferensi Daring Rendah",
    description:
      "Kamu tidak menunjukkan kecenderungan kuat untuk memilih interaksi daring dibanding tatap muka. Ini berada di bawah rata-rata sampel rujukan (M=7.26).",
    recommendation: "Pertahankan keseimbangan antara interaksi daring dan tatap muka.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "POSI",
    minScore: "8.00",
    maxScore: "11.00",
    label: "POSI: Preferensi Daring Sedang",
    description:
      "Kamu menunjukkan kecenderungan moderat untuk memilih interaksi sosial secara daring. Ini berada di atas rata-rata sampel rujukan (M=7.26).",
    recommendation:
      "Tetap jaga keseimbangan. Usahakan untuk secara aktif mencari interaksi tatap muka sebagai pelengkap.",
    severity: "moderate" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "POSI",
    minScore: "12.00",
    maxScore: "15.00",
    label: "POSI: Preferensi Daring Tinggi",
    description:
      "Kamu sangat cenderung memilih interaksi daring dibanding tatap muka. Preferensi yang sangat tinggi ini dapat membatasi pengembangan keterampilan sosial langsung.",
    recommendation:
      "Pertimbangkan untuk aktif mencari dan berlatih interaksi tatap muka. Diskusikan dengan konselor jika ini menyulitkan.",
    severity: "high" as const,
    version: 1,
  },

  // ── GPIUS-2 Subscale: MR — Regulasi Suasana Hati ───────────────
  // Scale 3–15, R&S 2016 M=10.59. Bands: 3–10 / 11–13 / 14–15.
  // MR: uses internet to regulate/escape negative moods.
  {
    testSlug: "gpius2",
    dimension: "MR",
    minScore: "3.00",
    maxScore: "10.00",
    label: "MR: Regulasi Suasana Hati Rendah",
    description:
      "Kamu jarang menggunakan internet sebagai strategi utama untuk mengatur suasana hati. Ini berada di bawah rata-rata sampel rujukan (M=10.59).",
    recommendation: "Pertahankan strategi coping yang beragam dan tidak bergantung pada internet.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "MR",
    minScore: "11.00",
    maxScore: "13.00",
    label: "MR: Regulasi Suasana Hati Sedang",
    description:
      "Kamu cenderung menggunakan internet untuk mengatasi suasana hati negatif pada tingkat yang moderat, sedikit di atas rata-rata sampel rujukan (M=10.59).",
    recommendation:
      "Kembangkan strategi coping alternatif seperti olahraga, journaling, atau berbicara dengan orang terpercaya.",
    severity: "moderate" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "MR",
    minScore: "14.00",
    maxScore: "15.00",
    label: "MR: Regulasi Suasana Hati Tinggi",
    description:
      "Kamu sangat mengandalkan internet sebagai cara utama mengatur suasana hati. Pola ini dapat memperkuat siklus penggunaan bermasalah.",
    recommendation:
      "Sangat disarankan untuk berkonsultasi dengan psikolog guna mengembangkan strategi regulasi emosi yang lebih sehat.",
    severity: "high" as const,
    version: 1,
  },

  // ── GPIUS-2 Subscale: CP — Preokupasi Kognitif ─────────────────
  // Scale 3–15, R&S 2016 M=8.76. Bands: 3–8 / 9–12 / 13–15.
  // CP: obsessive thoughts about being online.
  {
    testSlug: "gpius2",
    dimension: "CP",
    minScore: "3.00",
    maxScore: "8.00",
    label: "CP: Preokupasi Kognitif Rendah",
    description:
      "Kamu jarang memikirkan internet secara obsesif saat sedang offline. Ini berada di bawah rata-rata sampel rujukan (M=8.76).",
    recommendation: "Pertahankan pola pikir yang seimbang antara aktivitas daring dan luring.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "CP",
    minScore: "9.00",
    maxScore: "12.00",
    label: "CP: Preokupasi Kognitif Sedang",
    description:
      "Kamu menunjukkan kecenderungan moderat untuk memikirkan internet saat tidak sedang menggunakannya, di atas rata-rata sampel rujukan (M=8.76).",
    recommendation:
      "Latih teknik mindfulness untuk tetap hadir secara penuh dalam aktivitas sehari-hari tanpa distraksi pikiran tentang internet.",
    severity: "moderate" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "CP",
    minScore: "13.00",
    maxScore: "15.00",
    label: "CP: Preokupasi Kognitif Tinggi",
    description:
      "Pikiran tentang internet mendominasi secara berlebihan bahkan saat kamu tidak sedang online. Ini adalah indikasi kunci penggunaan internet bermasalah.",
    recommendation:
      "Pertimbangkan konsultasi profesional. Teknik CBT (Cognitive Behavioral Therapy) dapat membantu merestrukturisasi pola pikir obsesif tentang internet.",
    severity: "high" as const,
    version: 1,
  },

  // ── GPIUS-2 Subscale: CU — Penggunaan Kompulsif ────────────────
  // Scale 3–15, R&S 2016 M=9.07. Bands: 3–9 / 10–12 / 13–15.
  // CU: compulsive, uncontrolled internet use patterns.
  {
    testSlug: "gpius2",
    dimension: "CU",
    minScore: "3.00",
    maxScore: "9.00",
    label: "CU: Penggunaan Kompulsif Rendah",
    description:
      "Kamu tidak menunjukkan pola penggunaan internet yang kompulsif secara signifikan. Ini berada di bawah rata-rata sampel rujukan (M=9.07).",
    recommendation: "Pertahankan kontrol diri yang baik atas waktu penggunaan internet.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "CU",
    minScore: "10.00",
    maxScore: "12.00",
    label: "CU: Penggunaan Kompulsif Sedang",
    description:
      "Kamu menunjukkan beberapa kesulitan dalam membatasi atau menghentikan penggunaan internet saat diperlukan, di atas rata-rata sampel rujukan (M=9.07).",
    recommendation:
      "Tetapkan aturan waktu layar yang jelas. Gunakan fitur pembatas waktu aplikasi dan buat jadwal 'offline' yang konsisten.",
    severity: "moderate" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "CU",
    minScore: "13.00",
    maxScore: "15.00",
    label: "CU: Penggunaan Kompulsif Tinggi",
    description:
      "Kamu mengalami kesulitan nyata mengendalikan penggunaan internet meskipun ada keinginan untuk berhenti atau mengurangi. Ini adalah indikasi penggunaan kompulsif yang serius.",
    recommendation:
      "Konsultasikan dengan psikolog. Strategi manajemen perilaku dan dukungan sosial sangat dianjurkan untuk membantu mengurangi pola kompulsif ini.",
    severity: "high" as const,
    version: 1,
  },

  // ── GPIUS-2 Subscale: NO — Dampak Negatif ──────────────────────
  // Scale 3–15, R&S 2016 M=7.74. Bands: 3–7 / 8–11 / 12–15.
  // NO: negative real-world outcomes caused by internet use.
  {
    testSlug: "gpius2",
    dimension: "NO",
    minScore: "3.00",
    maxScore: "7.00",
    label: "NO: Dampak Negatif Rendah",
    description:
      "Penggunaan internet belum menimbulkan dampak negatif yang signifikan pada kehidupanmu. Ini berada di bawah rata-rata sampel rujukan (M=7.74).",
    recommendation:
      "Pertahankan pola penggunaan yang tidak mengganggu aktivitas dan hubungan sosial sehari-hari.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "NO",
    minScore: "8.00",
    maxScore: "11.00",
    label: "NO: Dampak Negatif Sedang",
    description:
      "Penggunaan internet mulai menimbulkan beberapa dampak negatif pada aktivitas atau hubungan sosialmu, di atas rata-rata sampel rujukan (M=7.74).",
    recommendation:
      "Identifikasi area kehidupan mana yang paling terdampak (misalnya tidur, studi, hubungan sosial) dan buat rencana konkret untuk meminimalkan gangguan.",
    severity: "moderate" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "NO",
    minScore: "12.00",
    maxScore: "15.00",
    label: "NO: Dampak Negatif Tinggi",
    description:
      "Penggunaan internet telah menyebabkan dampak negatif yang nyata dan signifikan pada kehidupan sehari-hari, seperti melewatkan acara penting atau kesulitan mengatur kehidupan.",
    recommendation:
      "Konsultasikan dengan profesional kesehatan mental. Dampak yang sudah nyata di kehidupan nyata memerlukan intervensi yang lebih terstruktur.",
    severity: "high" as const,
    version: 1,
  },

  // ── GPIUS-2 Subscale: DSR — Disregulasi Diri (CP + CU) ─────────
  // Second-order dimension: DSR = CP + CU. Scale 6–30, R&S 2016 M=17.83.
  // Bands: 6–17 (below mean) / 18–24 (near-above mean) / 25–30 (high).
  // Caplan (2010): DSR is the core cognitive-behavioral pathway in GPIUS.
  {
    testSlug: "gpius2",
    dimension: "DSR",
    minScore: "6.00",
    maxScore: "17.00",
    label: "DSR: Disregulasi Diri Rendah",
    description:
      "Kombinasi preokupasi kognitif dan penggunaan kompulsif berada di bawah rata-rata sampel rujukan (M=17.83). Tidak ditemukan indikasi signifikan disregulasi diri terkait internet.",
    recommendation:
      "Pertahankan kendali diri yang baik atas pikiran dan perilaku penggunaan internet.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "DSR",
    minScore: "18.00",
    maxScore: "24.00",
    label: "DSR: Disregulasi Diri Sedang",
    description:
      "Skor gabungan preokupasi kognitif dan penggunaan kompulsif berada di atas rata-rata sampel rujukan (M=17.83). Ini adalah dimensi inti yang perlu diperhatikan.",
    recommendation:
      "Kembangkan strategi manajemen diri: jadwal penggunaan internet yang terstruktur, teknik mindfulness, dan identifikasi pemicu penggunaan berlebih.",
    severity: "moderate" as const,
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: "DSR",
    minScore: "25.00",
    maxScore: "30.00",
    label: "DSR: Disregulasi Diri Tinggi",
    description:
      "Kombinasi preokupasi kognitif dan penggunaan kompulsif yang sangat tinggi — ini adalah dimensi inti penggunaan internet bermasalah menurut model Caplan (2010). Indikasi ini memerlukan perhatian serius.",
    recommendation:
      "Sangat disarankan untuk berkonsultasi dengan psikolog. CBT dan strategi regulasi diri berbasis bukti dapat membantu mengatasi pola disregulasi kognitif dan perilaku ini.",
    severity: "high" as const,
    version: 1,
  },

  // ── SRS (Total Score Range: 11–66) — INVERTED POLARITY ─────
  {
    testSlug: "srs",
    dimension: null,
    minScore: "11.00",
    maxScore: "33.00",
    label: "Resiliensi Rendah",
    description:
      "Kamu mungkin mengalami kesulitan dalam menghadapi tekanan dan tantangan. Membangun keterampilan coping, dukungan sosial, dan efikasi diri melalui bimbingan profesional dapat bermanfaat.",
    recommendation:
      "Pertimbangkan untuk berkonsultasi dengan psikolog guna mengembangkan strategi coping. Bangun jaringan dukungan sosial dan mulai dengan langkah kecil untuk meningkatkan kepercayaan diri.",
    severity: "high",
    version: 1,
  },
  {
    testSlug: "srs",
    dimension: null,
    minScore: "34.00",
    maxScore: "50.00",
    label: "Resiliensi Sedang",
    description:
      "Kamu menunjukkan kemampuan cukup dalam menghadapi tantangan. Memperkuat area tertentu seperti efikasi diri atau kontrol yang dirasakan dapat meningkatkan kapasitas coping kamu.",
    recommendation:
      "Kembangkan kebiasaan positif seperti refleksi diri, penetapan tujuan realistis, dan latihan mindfulness. Pertimbangkan untuk memperluas jaringan sosial sebagai sumber dukungan.",
    severity: "moderate",
    version: 1,
  },
  {
    testSlug: "srs",
    dimension: null,
    minScore: "51.00",
    maxScore: "66.00",
    label: "Resiliensi Tinggi",
    description:
      "Kamu menunjukkan kemampuan yang baik dalam menghadapi tekanan dan bangkit dari tantangan. Kamu tampaknya memiliki perlengkapan yang baik untuk mengatasi kesulitan.",
    recommendation:
      "Pertahankan kebiasaan positif yang telah kamu bangun. Pertimbangkan untuk menjadi mentor atau sumber dukungan bagi orang lain yang membutuhkan.",
    severity: "low",
    version: 1,
  },

  // ── SRQ-29 — Cluster-based multi-domain interpretation ─────
  // Domain: Neurotic (Q1-Q20) — flag at ≥6 "Ya" (Kemenkes/Riskesdas standard)
  {
    testSlug: "srq29",
    dimension: "neurotic",
    minScore: "0.00",
    maxScore: "5.00",
    label: "Normal",
    description:
      "Tidak ditemukan indikasi masalah psikologis yang signifikan pada domain kecemasan dan depresi.",
    recommendation:
      "Terus jaga kesehatan mental dengan pola hidup sehat, istirahat cukup, dan aktivitas yang menyenangkan.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "srq29",
    dimension: "neurotic",
    minScore: "6.00",
    maxScore: "20.00",
    label: "Cemas / Depresi",
    description:
      "Terdapat indikasi masalah psikologis berupa kecemasan dan/atau gejala depresi yang perlu perhatian lebih lanjut.",
    recommendation:
      "Disarankan untuk berkonsultasi dengan psikolog klinis atau psikiater untuk evaluasi lebih lanjut.",
    severity: "high" as const,
    version: 1,
  },
  // Domain: Substance Use (Q21) — flag at = 1
  {
    testSlug: "srq29",
    dimension: "substance",
    minScore: "0.00",
    maxScore: "0.00",
    label: "Normal",
    description: "Tidak ditemukan indikasi penggunaan zat psikoaktif atau narkoba.",
    recommendation: "Pertahankan gaya hidup bebas dari zat adiktif.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "srq29",
    dimension: "substance",
    minScore: "1.00",
    maxScore: "1.00",
    label: "Penggunaan Zat Psikoaktif",
    description:
      "Terdapat indikasi penggunaan alkohol berlebihan atau penggunaan narkoba yang memerlukan perhatian khusus.",
    recommendation:
      "Segera konsultasikan dengan tenaga profesional kesehatan untuk evaluasi dan dukungan pemulihan.",
    severity: "high" as const,
    version: 1,
  },
  // Domain: Psychotic Symptoms (Q22-Q24) — flag at ≥1
  {
    testSlug: "srq29",
    dimension: "psychotic",
    minScore: "0.00",
    maxScore: "0.00",
    label: "Normal",
    description: "Tidak ditemukan indikasi gejala gangguan psikotik.",
    recommendation:
      "Jaga kesehatan mental dan waspadai perubahan pikiran atau persepsi yang tidak biasa.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "srq29",
    dimension: "psychotic",
    minScore: "1.00",
    maxScore: "3.00",
    label: "Gejala Gangguan Psikotik",
    description:
      "Terdapat indikasi gejala gangguan psikotik yang memerlukan evaluasi segera oleh tenaga profesional.",
    recommendation:
      "Sangat disarankan untuk segera berkonsultasi dengan psikiater atau dokter spesialis jiwa.",
    severity: "high" as const,
    version: 1,
  },
  // Domain: PTSD Symptoms (Q25-Q29) — flag at ≥1
  {
    testSlug: "srq29",
    dimension: "ptsd",
    minScore: "0.00",
    maxScore: "0.00",
    label: "Normal",
    description: "Tidak ditemukan indikasi gejala gangguan stres pasca-trauma (PTSD).",
    recommendation:
      "Tetap jaga kesehatan mental. Jika pernah mengalami peristiwa traumatis, jangan ragu mencari dukungan.",
    severity: "low" as const,
    version: 1,
  },
  {
    testSlug: "srq29",
    dimension: "ptsd",
    minScore: "1.00",
    maxScore: "5.00",
    label: "Gejala Gangguan PTSD",
    description:
      "Terdapat indikasi gejala stres pasca-trauma yang berkaitan dengan pengalaman bencana atau peristiwa traumatis.",
    recommendation:
      "Disarankan untuk berkonsultasi dengan psikolog klinis atau psikiater yang berpengalaman dalam penanganan trauma.",
    severity: "high" as const,
    version: 1,
  },
];
