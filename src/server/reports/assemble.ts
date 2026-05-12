/**
 * CHP Platform — Report Data Assembler
 *
 * Aggregates all data needed to render a clinical PDF report from a single
 * `resultId`. Queries across results → test_sessions → tests → questions →
 * answers → result_interpretations to build a typed `ReportData` object.
 */
import { eq, asc, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { tests, questions, resultInterpretations, options } from "@/server/schema/tests";
import { testSessions, answers, results } from "@/server/schema/sessions";
import { guestLeads } from "@/server/schema/consents";
import { sessionDemographics } from "@/server/schema/session-demographics";
import { decrypt } from "@/server/utils/encryption";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface ReportItem {
  order: number;
  questionText: string;
  dimension: string | null;
  isReversed: boolean;
  rawAnswer: number;
  answerText: string;
  maxPoints: number;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
  label?: string;
  description?: string;
  severity?: string;
}

export interface ReportInterpretation {
  label: string;
  description: string;
  recommendation: string | null;
  severity: string;
}

export interface ReportProfile {
  id: string;
  name: string;
  email: string;
  age: number | null;
  sex: string;
  province: string;
  regency: string;
  jobTitle: string;
  education: string;
  testDate: string;
}

export interface ReportData {
  /** Test instrument metadata */
  testName: string;
  testSlug: string;
  testCategory: string;

  /** Session metadata */
  dateTaken: Date;
  dateCompleted: Date | null;

  /** User profile metadata */
  profile: ReportProfile;

  /** Scores */
  totalScore: number;
  maxPossibleScore: number;
  globalAverage: number | null;
  resultLabel: string | null;

  /** Dimension breakdown (if applicable) */
  dimensionScores: DimensionScore[];

  /** Overall interpretation */
  interpretation: ReportInterpretation | null;

  /** Individual item responses in order */
  items: ReportItem[];

  /** Crisis hotlines (static) */
  crisisHotlines: CrisisHotline[];
}

export interface CrisisHotline {
  name: string;
  number: string;
  description: string;
}

/** Indonesian crisis hotlines */
const CRISIS_HOTLINES: CrisisHotline[] = [
  {
    name: "Sejiwa",
    number: "119 ext. 8",
    description: "Layanan konseling krisis 24/7 dari Kemenkes RI",
  },
  {
    name: "Into The Light",
    number: "(021) 7884-5555",
    description: "Pencegahan bunuh diri dan kesehatan jiwa",
  },
  {
    name: "Yayasan Pulih",
    number: "(021) 788-42580",
    description: "Konseling psikologis dan trauma",
  },
];

/* ═══════════════════════════════════════════════════════
   Assembler
   ═══════════════════════════════════════════════════════ */

/**
 * Assemble all data needed to render a clinical PDF report.
 *
 * @param resultId — UUID of the results row
 * @returns Complete `ReportData` object
 * @throws Error if result, session, or test not found
 */
export async function assembleReportData(resultId: string): Promise<ReportData> {
  // 1. Fetch result
  const result = await db
    .select()
    .from(results)
    .where(eq(results.id, resultId))
    .limit(1)
    .then((r) => r[0]);

  if (!result) {
    throw new Error(`Result not found: ${resultId}`);
  }

  // 2. Fetch session
  const session = await db
    .select()
    .from(testSessions)
    .where(eq(testSessions.id, result.sessionId))
    .limit(1)
    .then((r) => r[0]);

  if (!session) {
    throw new Error(`Session not found: ${result.sessionId}`);
  }

  // 2a. Fetch Demographics and Guest Lead
  const demo = await db
    .select()
    .from(sessionDemographics)
    .where(eq(sessionDemographics.sessionId, result.sessionId))
    .limit(1)
    .then((r) => r[0]);

  const lead = await db
    .select()
    .from(guestLeads)
    .where(eq(guestLeads.sessionId, result.sessionId))
    .limit(1)
    .then((r) => r[0]);

  let email = "Anonymous";
  if (lead?.encryptedEmail) {
    try {
      email = decrypt(lead.encryptedEmail);
    } catch {
      console.warn("Failed to decrypt email for session:", result.sessionId);
    }
  }

  const profile: ReportProfile = {
    id: lead?.id ?? "Anonymous",
    name: demo?.name ?? "Anonymous User",
    email,
    age: demo?.age ?? null,
    sex: demo?.sex ?? "Not specified",
    province: demo?.province ?? "Not specified",
    regency: demo?.city ?? "Not specified",
    jobTitle: "-", // Not collected in current schema
    education: "-", // Not collected in current schema
    testDate: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(session.startedAt),
  };

  // 3. Fetch test instrument
  const test = await db
    .select()
    .from(tests)
    .where(eq(tests.id, result.testId))
    .limit(1)
    .then((r) => r[0]);

  if (!test) {
    throw new Error(`Test not found: ${result.testId}`);
  }

  // 4. Fetch all questions for this test (ordered)
  const questionRows = await db
    .select()
    .from(questions)
    .where(eq(questions.testId, result.testId))
    .orderBy(asc(questions.order));

  // 4b. Fetch options for these questions
  const questionIds = questionRows.map((q) => q.id);
  const optionRows =
    questionIds.length > 0
      ? await db.select().from(options).where(inArray(options.questionId, questionIds))
      : [];

  // Build options lookup: questionId → array of options
  const optionsMap = new Map<string, Array<{ label: string; value: number }>>();
  for (const opt of optionRows) {
    if (!optionsMap.has(opt.questionId)) optionsMap.set(opt.questionId, []);
    optionsMap.get(opt.questionId)!.push({ label: opt.label, value: opt.value });
  }

  // 5. Fetch all answers for this session
  const answerRows = await db.select().from(answers).where(eq(answers.sessionId, result.sessionId));

  // Build answer lookup: questionId → value
  const answerMap = new Map<string, number>();
  for (const a of answerRows) {
    const val = a.value as { selected?: number; value?: number };
    answerMap.set(a.questionId, val.selected ?? val.value ?? 0);
  }

  // 6. Build item responses
  const items: ReportItem[] = questionRows.map((q) => {
    const rawAnswer = answerMap.get(q.id) ?? 0;
    const opts = optionsMap.get(q.id) ?? [];

    // Find the label for the chosen answer, fallback to stringified numeric value
    const answerText = opts.find((o) => o.value === rawAnswer)?.label ?? String(rawAnswer);

    // Calculate max points for this question based on its options
    const maxPoints = opts.length > 0 ? Math.max(...opts.map((o) => o.value)) : rawAnswer;

    return {
      order: q.order,
      questionText: q.questionText,
      dimension: q.dimension,
      isReversed: q.isReversed,
      rawAnswer,
      answerText,
      maxPoints,
    };
  });

  // 7. Parse dimension scores from JSONB
  const rawDimScores =
    (result.dimensionScores as Record<string, { score: number; maxScore: number }>) ?? {};
  const dimensionScoreEntries: DimensionScore[] = Object.entries(rawDimScores).map(
    ([dim, data]) => ({
      dimension: dim,
      score: data.score,
      maxScore: data.maxScore,
    })
  );

  // 8. Fetch interpretation
  const totalScore = parseFloat(result.totalScore ?? "0");
  const interpretationRows = await db
    .select()
    .from(resultInterpretations)
    .where(eq(resultInterpretations.testId, result.testId));

  // Find matching overall interpretation (no dimension = overall)
  const overallInterp = interpretationRows.find(
    (row) =>
      !row.dimension &&
      totalScore >= parseFloat(row.minScore) &&
      totalScore <= parseFloat(row.maxScore)
  );

  // Enrich dimension scores with interpretation labels
  for (const ds of dimensionScoreEntries) {
    const dimInterp = interpretationRows.find(
      (row) =>
        row.dimension === ds.dimension &&
        ds.score >= parseFloat(row.minScore) &&
        ds.score <= parseFloat(row.maxScore)
    );
    if (dimInterp) {
      ds.label = dimInterp.label;
      ds.description = dimInterp.description;
      ds.severity = dimInterp.severity;
    }
  }

  // Compute global average for this test
  const [avgRow] = await db
    .select({ avg: sql<string>`AVG(CAST(${results.totalScore} AS numeric))` })
    .from(results)
    .innerJoin(testSessions, eq(testSessions.id, results.sessionId))
    .where(eq(testSessions.testId, session.testId));

  const globalAverage = avgRow?.avg 
    ? Math.round(parseFloat(avgRow.avg)) 
    : null;

  // 9. Calculate max possible score from questions × max option value
  // Approximate: number of questions × 4 (typical Likert 0-4)
  const computedScores = result.computedScores as { maxPossibleScore?: number };
  const maxPossibleScore = computedScores?.maxPossibleScore ?? questionRows.length * 4;

  return {
    testName: test.title,
    testSlug: test.slug,
    testCategory: test.category,
    dateTaken: session.startedAt,
    dateCompleted: session.completedAt,
    profile,
    totalScore,
    maxPossibleScore,
    globalAverage,
    resultLabel: result.resultLabel,
    dimensionScores: dimensionScoreEntries,
    interpretation: overallInterp
      ? {
          label: overallInterp.label,
          description: overallInterp.description,
          recommendation: overallInterp.recommendation,
          severity: overallInterp.severity,
        }
      : null,
    items,
    crisisHotlines: CRISIS_HOTLINES,
  };
}
