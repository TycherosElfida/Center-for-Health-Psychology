/**
 * Question Data — Static question definitions for all assessment instruments.
 *
 * This module is a plain TS file (no "use client" / "use server") so both
 * Server Components (page.tsx) and Client Components (AssessmentForm) can
 * import it without boundary violations.
 *
 * Question IDs here are numeric (matching the original instrument specs).
 * The DB schema uses UUIDs for `questions.id`, but the client-side
 * assessment engine operates on these numeric IDs during the test session.
 * The mapping to UUID happens at the server boundary in the tRPC procedures.
 */

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface AnswerOption {
  label: string;
  value: number;
}

export interface Question {
  id: number;
  text: string;
  reversed?: boolean;
  options: AnswerOption[];
}

/* ═══════════════════════════════════════════════════════
   Shared Option Sets
   ═══════════════════════════════════════════════════════ */

const pss10Options: AnswerOption[] = [
  { label: "Never", value: 0 },
  { label: "Almost Never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Fairly Often", value: 3 },
  { label: "Very Often", value: 4 },
];

const yesNoOptions: AnswerOption[] = [
  { label: "Yes", value: 1 },
  { label: "No", value: 0 },
];

const agreeOptions: AnswerOption[] = [
  { label: "Strongly Agree", value: 4 },
  { label: "Agree", value: 3 },
  { label: "Neutral", value: 2 },
  { label: "Disagree", value: 1 },
  { label: "Strongly Disagree", value: 0 },
];

const gpius2Options: AnswerOption[] = [
  { label: "Sangat Tidak Sesuai", value: 1 },
  { label: "Tidak Sesuai", value: 2 },
  { label: "Netral", value: 3 },
  { label: "Sesuai", value: 4 },
  { label: "Sangat Sesuai", value: 5 },
];

const srsOptions: AnswerOption[] = [
  { label: "Sangat Tidak Setuju", value: 1 },
  { label: "Tidak Setuju", value: 2 },
  { label: "Agak Tidak Setuju", value: 3 },
  { label: "Agak Setuju", value: 4 },
  { label: "Setuju", value: 5 },
  { label: "Sangat Setuju", value: 6 },
];

/* ═══════════════════════════════════════════════════════
   Question Definitions
   ═══════════════════════════════════════════════════════ */

export const QUESTIONS: Record<string, Question[]> = {
  pss10: [
    {
      id: 1,
      text: "In the last month, how often have you been upset because of something that happened unexpectedly?",
      options: pss10Options,
    },
    {
      id: 2,
      text: "In the last month, how often have you felt that you were unable to control the important things in your life?",
      options: pss10Options,
    },
    {
      id: 3,
      text: "In the last month, how often have you felt nervous and stressed?",
      options: pss10Options,
    },
    {
      id: 4,
      text: "In the last month, how often have you felt confident about your ability to handle your personal problems?",
      options: pss10Options,
      reversed: true,
    },
    {
      id: 5,
      text: "In the last month, how often have you felt that things were going your way?",
      options: pss10Options,
      reversed: true,
    },
    {
      id: 6,
      text: "In the last month, how often have you found that you could not cope with all the things that you had to do?",
      options: pss10Options,
    },
    {
      id: 7,
      text: "In the last month, how often have you been able to control irritations in your life?",
      options: pss10Options,
      reversed: true,
    },
    {
      id: 8,
      text: "In the last month, how often have you felt that you were on top of things?",
      options: pss10Options,
      reversed: true,
    },
    {
      id: 9,
      text: "In the last month, how often have you been angered because of things that were outside of your control?",
      options: pss10Options,
    },
    {
      id: 10,
      text: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?",
      options: pss10Options,
    },
  ],

  srq29: [
    { id: 1, text: "Do you often have headaches?", options: yesNoOptions },
    { id: 2, text: "Is your appetite poor?", options: yesNoOptions },
    { id: 3, text: "Do you sleep badly?", options: yesNoOptions },
    { id: 4, text: "Are you easily frightened?", options: yesNoOptions },
    { id: 5, text: "Do your hands shake?", options: yesNoOptions },
    { id: 6, text: "Do you feel nervous, tense, or worried?", options: yesNoOptions },
    { id: 7, text: "Is your digestion poor?", options: yesNoOptions },
    { id: 8, text: "Do you have trouble thinking clearly?", options: yesNoOptions },
    { id: 9, text: "Do you feel unhappy?", options: yesNoOptions },
    { id: 10, text: "Do you cry more than usual?", options: yesNoOptions },
  ],

  mbti: [
    {
      id: 1,
      text: "At a party, you tend to interact with many people, including strangers.",
      options: agreeOptions,
    },
    {
      id: 2,
      text: "You spend time exploring the unknown rather than what is already certain.",
      options: agreeOptions,
    },
    {
      id: 3,
      text: "You find it easy to stay relaxed and focused even when under pressure.",
      options: agreeOptions,
    },
    {
      id: 4,
      text: "You prefer to have a clear, detailed plan before starting a new project.",
      options: agreeOptions,
    },
    {
      id: 5,
      text: "You feel comfortable making important decisions based on feelings and values.",
      options: agreeOptions,
    },
    {
      id: 6,
      text: "You often lose track of time when working on an interesting problem.",
      options: agreeOptions,
    },
    {
      id: 7,
      text: "You prefer working in a team rather than working alone.",
      options: agreeOptions,
    },
    {
      id: 8,
      text: "You often make decisions based on objective data rather than gut feeling.",
      options: agreeOptions,
    },
    {
      id: 9,
      text: "You enjoy having a to-do list and checking things off.",
      options: agreeOptions,
    },
    {
      id: 10,
      text: "You find it easy to empathize with people whose experiences differ greatly from yours.",
      options: agreeOptions,
    },
    {
      id: 11,
      text: "You like to keep your options open rather than settle on one plan.",
      options: agreeOptions,
    },
    { id: 12, text: "You find small talk easy and enjoyable.", options: agreeOptions },
  ],

  gpius2: [
    {
      id: 1,
      text: "Saya lebih memilih interaksi sosial secara daring daripada komunikasi tatap muka.",
      options: gpius2Options,
    },
    {
      id: 2,
      text: "Saya telah menggunakan internet untuk berbicara dengan orang lain ketika merasa terisolasi.",
      options: gpius2Options,
    },
    {
      id: 3,
      text: "Saya merasa asyik mengingat pengalaman daring saya sebelumnya.",
      options: gpius2Options,
    },
    {
      id: 4,
      text: "Saya merasa sulit mengendalikan penggunaan internet saya.",
      options: gpius2Options,
    },
    {
      id: 5,
      text: "Penggunaan internet saya telah menyebabkan saya menemui kesulitan.",
      options: gpius2Options,
    },
    {
      id: 6,
      text: "Saya lebih aman berinteraksi dengan orang lain secara daring ketimbang secara langsung.",
      options: gpius2Options,
    },
    {
      id: 7,
      text: "Saya telah menggunakan internet untuk merasa lebih baik ketika saya merasa sedih.",
      options: gpius2Options,
    },
    { id: 8, text: "Saya berpikir secara obsesif tentang online.", options: gpius2Options },
    {
      id: 9,
      text: "Saya merasa bersalah atas waktu yang saya habiskan di internet.",
      options: gpius2Options,
    },
    {
      id: 10,
      text: "Penggunaan internet saya membuat saya sulit mengatur kehidupan saya.",
      options: gpius2Options,
    },
    {
      id: 11,
      text: "Saya lebih mudah untuk berkomunikasi dengan orang lain secara daring daripada secara langsung.",
      options: gpius2Options,
    },
    {
      id: 12,
      text: "Saya telah menggunakan internet untuk membuat diri saya merasa lebih baik ketika saya merasa kecewa.",
      options: gpius2Options,
    },
    {
      id: 13,
      text: "Saya tidak bisa berhenti berpikir tentang menggunakan internet.",
      options: gpius2Options,
    },
    {
      id: 14,
      text: "Saya telah mencoba tanpa berhasil mengurangi berapa banyak waktu saya menggunakan internet.",
      options: gpius2Options,
    },
    {
      id: 15,
      text: "Saya telah melewatkan acara sosial atau kegiatan karena penggunaan internet saya.",
      options: gpius2Options,
    },
  ],

  srs: [
    {
      id: 1,
      text: "Saya merasa tidak mungkin bagi saya mencapai tujuan yang saya perjuangkan.",
      options: srsOptions,
      reversed: true,
    },
    {
      id: 2,
      text: "Sejauh ini, saya sudah mendapatkan hal-hal penting yang saya inginkan dalam hidup.",
      options: srsOptions,
    },
    {
      id: 3,
      text: "Jika sesuatu yang salah dapat terjadi pada saya, maka hal itu akan terjadi.",
      options: srsOptions,
      reversed: true,
    },
    { id: 4, text: "Saya puas dengan hidup saya.", options: srsOptions },
    {
      id: 5,
      text: "Apa yang terjadi dalam hidup saya sering kali berada di luar kendali saya.",
      options: srsOptions,
      reversed: true,
    },
    { id: 6, text: "Saya dapat melakukan hal-hal yang ingin saya lakukan.", options: srsOptions },
    {
      id: 7,
      text: "Masa depan tampak tanpa harapan bagi saya dan saya tidak percaya bahwa segala sesuatu akan berubah menjadi lebih baik.",
      options: srsOptions,
      reversed: true,
    },
    {
      id: 8,
      text: "Ketika saya benar-benar ingin melakukan sesuatu, saya biasanya menemukan cara untuk berhasil melakukannya.",
      options: srsOptions,
    },
    { id: 9, text: "Dalam banyak hal, hidup saya hampir mendekati ideal.", options: srsOptions },
    { id: 10, text: "Saya bisa melakukan apa saja yang saya inginkan.", options: srsOptions },
    {
      id: 11,
      text: "Tidak ada cara lain yang bisa saya lakukan untuk menyelesaikan masalah yang saya hadapi.",
      options: srsOptions,
      reversed: true,
    },
  ],
};

/* ═══════════════════════════════════════════════════════
   Accessors
   ═══════════════════════════════════════════════════════ */

/** Get the questions array for a given test slug. */
export function getQuestions(testSlug: string): Question[] | undefined {
  return QUESTIONS[testSlug];
}
