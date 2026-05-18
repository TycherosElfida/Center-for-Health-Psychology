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

  // ── GPIUS-2 (Total Score Range: 15–75) ─────────────────────
  // CUTOFF SOURCE DISCLAIMER:
  // The three-tier cutoffs (Normal ≤34 / Mild 35–52 / Severe 53–75) are
  // distribution-based heuristics derived from the Indonesian adaptation by
  // Reynaldo & Sokang (2016). No published clinical validation study exists
  // that establishes these specific thresholds as clinically diagnostic.
  // Caplan (2010) originally reported means and SDs but did not propose
  // categorical cutoffs. These ranges should be interpreted as screening
  // indicators, not clinical diagnoses. Future work should consider
  // norm-referencing against a representative Indonesian sample.
  {
    testSlug: "gpius2",
    dimension: null,
    minScore: "15.00",
    maxScore: "34.00",
    label: "Penggunaan Internet Normal",
    description:
      "Penggunaan internet kamu berada dalam batas wajar dan terkendali. Tidak ditemukan indikasi signifikan penggunaan internet yang bermasalah.",
    recommendation:
      "Pertahankan kebiasaan digital yang sehat. Tetap perhatikan waktu yang dihabiskan online dan pastikan aktivitas digital tidak mengganggu kehidupan sehari-hari.",
    severity: "low",
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: null,
    minScore: "35.00",
    maxScore: "52.00",
    label: "Penggunaan Internet Bermasalah Ringan",
    description:
      "Terdapat beberapa indikasi penggunaan internet yang kurang sehat. Perhatikan kebiasaan online kamu dan tetapkan batasan yang sehat.",
    recommendation:
      "Mulai pantau waktu penggunaan internet. Tetapkan jadwal 'offline' dan cari aktivitas alternatif di luar jaringan. Pertimbangkan digital detox secara berkala.",
    severity: "moderate",
    version: 1,
  },
  {
    testSlug: "gpius2",
    dimension: null,
    minScore: "53.00",
    maxScore: "75.00",
    label: "Penggunaan Internet Bermasalah Tinggi",
    description:
      "Pola penggunaan internet menunjukkan dampak signifikan terhadap kehidupan sehari-hari. Disarankan untuk berkonsultasi dengan profesional mengenai kebiasaan digital yang lebih sehat.",
    recommendation:
      "Sangat disarankan untuk berkonsultasi dengan psikolog yang berpengalaman dalam isu perilaku digital. Mulai batasi penggunaan internet secara bertahap dan libatkan orang terdekat dalam proses perubahan.",
    severity: "high",
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
