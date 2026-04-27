/**
 * T0.4 — Result Interpretation Seed Data
 *
 * Clinically grounded score-range → label → recommendation → severity
 * mappings for PSS-10, GPIUS-2, SRS, and SRQ-29.
 *
 * Sources:
 *   - PSS-10: Cohen et al. (1983/1994) — Low ≤13, Moderate 14–26, High 27–40
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
  {
    testSlug: "pss10",
    dimension: null,
    minScore: "0.00",
    maxScore: "13.00",
    label: "Stres Rendah",
    description:
      "Kondisi stres kamu saat ini termasuk rendah. Kamu tampaknya dapat mengelola tuntutan kehidupan dengan baik. Pertahankan kebiasaan sehat dan rutinitas perawatan diri.",
    recommendation:
      "Terus jaga pola hidup sehat: tidur cukup, olahraga rutin, dan luangkan waktu untuk aktivitas yang menyenangkan.",
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
      "Kondisi stres kamu saat ini termasuk sedang. Pertimbangkan untuk menggunakan teknik pengurangan stres seperti mindfulness, meditasi, atau olahraga teratur.",
    recommendation:
      "Cobalah teknik relaksasi seperti pernapasan dalam, meditasi, atau journaling. Jika stres berlanjut, pertimbangkan untuk berkonsultasi dengan profesional.",
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
      "Kondisi stres kamu saat ini termasuk tinggi. Disarankan untuk berkonsultasi dengan profesional kesehatan mental guna mengembangkan strategi coping yang efektif.",
    recommendation:
      "Sangat disarankan untuk berkonsultasi dengan psikolog atau konselor. Prioritaskan istirahat dan hindari mengambil terlalu banyak tanggung jawab dalam waktu dekat.",
    severity: "high",
    version: 1,
  },

  // ── GPIUS-2 (Total Score Range: 15–75) ─────────────────────
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
  // Domain: Neurotic (Q1-Q20) — flag at ≥5 "Ya"
  {
    testSlug: "srq29",
    dimension: "neurotic",
    minScore: "0.00",
    maxScore: "4.00",
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
    minScore: "5.00",
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
