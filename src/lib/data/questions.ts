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
  id: string;
  text: string;
  dimension?: string;
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
      id: "64639b0b-4ec4-450f-94e1-9c925da5c609",
      text: "In the last month, how often have you been upset because of something that happened unexpectedly?",
      options: pss10Options,
      dimension: "Helplessness",
    },
    {
      id: "0f2413a3-4d94-49c6-9ae1-22e286fc4a81",
      text: "In the last month, how often have you felt that you were unable to control the important things in your life?",
      options: pss10Options,
      dimension: "Helplessness",
    },
    {
      id: "2c9cf269-ae7c-49ac-83ab-ec3a1e9ac4a1",
      text: "In the last month, how often have you felt nervous and stressed?",
      options: pss10Options,
      dimension: "Helplessness",
    },
    {
      id: "9d48f6fc-248c-4111-9a4c-4a591b46d818",
      text: "In the last month, how often have you felt confident about your ability to handle your personal problems?",
      options: pss10Options,
      dimension: "Self-Efficacy",
      reversed: true,
    },
    {
      id: "7302c8b7-4882-46ec-b1a4-57ed5b9167af",
      text: "In the last month, how often have you felt that things were going your way?",
      options: pss10Options,
      dimension: "Self-Efficacy",
      reversed: true,
    },
    {
      id: "1a5a865a-8129-4a40-87d4-a9afe646c3f8",
      text: "In the last month, how often have you found that you could not cope with all the things that you had to do?",
      options: pss10Options,
      dimension: "Helplessness",
    },
    {
      id: "7a165f27-c53d-4f02-b1f5-5f43e15d4018",
      text: "In the last month, how often have you been able to control irritations in your life?",
      options: pss10Options,
      dimension: "Self-Efficacy",
      reversed: true,
    },
    {
      id: "851d9a70-e7b0-4909-befe-919a8a230fba",
      text: "In the last month, how often have you felt that you were on top of things?",
      options: pss10Options,
      dimension: "Self-Efficacy",
      reversed: true,
    },
    {
      id: "3b1d4d8e-ad43-4393-84ce-57f60659a148",
      text: "In the last month, how often have you been angered because of things that were outside of your control?",
      options: pss10Options,
      dimension: "Helplessness",
    },
    {
      id: "c72ab765-c18f-4b4f-9b65-8722f17f07f5",
      text: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?",
      options: pss10Options,
      dimension: "Helplessness",
    },
  ],

  srq29: [
    {
      id: "9c646827-055b-48e5-b2c6-2eb0de87f10c",
      text: "Apakah kamu sering merasa sakit kepala?",
      options: yesNoOptions,
    },
    {
      id: "5597a915-169e-4437-9c3d-0b6b48e56a74",
      text: "Apakah kamu kehilangan nafsu makan?",
      options: yesNoOptions,
    },
    {
      id: "aa7a1ec2-fae0-4871-8859-626c169e98db",
      text: "Apakah tidur kamu tidak nyenyak?",
      options: yesNoOptions,
    },
    {
      id: "3ece958d-a163-4976-bf9a-dfe84a0aed0a",
      text: "Apakah kamu mudah merasa takut?",
      options: yesNoOptions,
    },
    {
      id: "52afaf8b-ef12-482d-892d-9e4cc1d81134",
      text: "Apakah kamu merasa cemas, tegang, atau khawatir?",
      options: yesNoOptions,
    },
    {
      id: "b2177f92-f5c6-4226-8098-ef5796f6eae8",
      text: "Apakah tangan kamu gemetar?",
      options: yesNoOptions,
    },
    {
      id: "5d0f4528-e4ca-4657-b429-f6788c183459",
      text: "Apakah kamu mengalami gangguan pencernaan?",
      options: yesNoOptions,
    },
    {
      id: "a51609b9-e1b0-45aa-ad70-88bf120c2bed",
      text: "Apakah kamu merasa sulit berpikir jernih?",
      options: yesNoOptions,
    },
    {
      id: "47f4969c-d4cb-4670-a641-eff1c1732053",
      text: "Apakah kamu merasa tidak bahagia?",
      options: yesNoOptions,
    },
    {
      id: "35bbd278-f9ee-40bf-84df-2a70844286f7",
      text: "Apakah kamu lebih sering menangis?",
      options: yesNoOptions,
    },
    {
      id: "3a0fe558-0785-40b7-a83f-3496bb3f82d9",
      text: "Apakah kamu merasa sulit untuk menikmati aktivitas sehari-hari?",
      options: yesNoOptions,
    },
    {
      id: "539a31d0-7f42-4213-8d0a-f7aef5c1fb4c",
      text: "Apakah kamu mengalami kesulitan untuk mengambil keputusan?",
      options: yesNoOptions,
    },
    {
      id: "15d88521-2a72-4fec-ab93-294ebf00b3d5",
      text: "Apakah aktivitas/tugas sehari-hari kamu terbengkalai?",
      options: yesNoOptions,
    },
    {
      id: "7b5b0c2c-63e2-4563-9f16-09983fa9fa5a",
      text: "Apakah kamu merasa tidak mampu berperan dalam kehidupan ini?",
      options: yesNoOptions,
    },
    {
      id: "9b609674-0951-4dd8-8b24-77baa31622b1",
      text: "Apakah kamu kehilangan minat terhadap banyak hal?",
      options: yesNoOptions,
    },
    {
      id: "4735dfb6-4cd3-49b3-9bf6-f4c62282b1e8",
      text: "Apakah kamu merasa tidak berharga?",
      options: yesNoOptions,
    },
    {
      id: "8a9a113e-9098-47a7-8de6-cbf5412dd7ca",
      text: "Apakah kamu mempunyai pikiran untuk mengakhiri hidup kamu?",
      options: yesNoOptions,
    },
    {
      id: "71d975ae-a29e-418d-b402-bef87853cfb3",
      text: "Apakah kamu merasa lelah sepanjang waktu?",
      options: yesNoOptions,
    },
    {
      id: "c4db99a0-b9e6-41d2-99bf-840c397ad2d9",
      text: "Apakah kamu merasa tidak enak di perut?",
      options: yesNoOptions,
    },
    {
      id: "493c6b92-0016-4ea1-8ef2-72d35b594d81",
      text: "Apakah kamu mudah lelah?",
      options: yesNoOptions,
    },
    {
      id: "320a4332-4d2c-442d-9985-c2ffba7766f8",
      text: "Apakah kamu minum alkohol lebih banyak dari biasanya atau apakah kamu menggunakan narkoba?",
      options: yesNoOptions,
    },
    {
      id: "3760f0ad-65de-421b-a533-0e662207e44c",
      text: "Apakah kamu yakin bahwa seseorang mencoba mencelakai kamu dengan cara tertentu?",
      options: yesNoOptions,
    },
    {
      id: "049b0458-b7d5-4803-bec5-f8f520e8f0b6",
      text: "Apakah ada yang mengganggu atau hal yang tidak biasa dalam pikiran kamu?",
      options: yesNoOptions,
    },
    {
      id: "aa7ac5bd-dd56-4891-a86c-b898e198b016",
      text: "Apakah kamu pernah mendengar suara tanpa tahu sumbernya atau yang orang lain tidak dapat mendengar?",
      options: yesNoOptions,
    },
    {
      id: "1773240c-1c00-4998-af48-6ec3945d1402",
      text: "Apakah kamu mengalami mimpi yang mengganggu tentang suatu bencana/musibah atau adakah saat-saat kamu seolah mengalami kembali kejadian bencana itu?",
      options: yesNoOptions,
    },
    {
      id: "3078b8e7-4e17-4df6-a1f4-3d60cb207f10",
      text: "Apakah kamu menghindari kegiatan, tempat, orang atau pikiran yang mengingatkan kamu akan bencana tersebut?",
      options: yesNoOptions,
    },
    {
      id: "429aa465-c6b9-4f4d-8dff-5e7a4ddeb68a",
      text: "Apakah minat kamu terhadap teman dan kegiatan yang biasa kamu lakukan berkurang?",
      options: yesNoOptions,
    },
    {
      id: "c5a869bc-7939-4867-bc55-8e90c4768c99",
      text: "Apakah kamu merasa sangat terganggu jika berada dalam situasi yang mengingatkan kamu akan bencana atau jika kamu berpikir tentang bencana itu?",
      options: yesNoOptions,
    },
    {
      id: "f898110d-6ee8-4eb4-a125-76a6ad00e710",
      text: "Apakah kamu kesulitan memahami atau mengekspresikan perasaan kamu?",
      options: yesNoOptions,
    },
  ],

  mbti: [
    {
      id: "b11ee3c1-fa8d-4685-9f28-3b3466347368",
      text: "At a party, you tend to interact with many people, including strangers.",
      options: agreeOptions,
    },
    {
      id: "6574affa-55d1-48a9-b37b-5ead5ca397ed",
      text: "You spend time exploring the unknown rather than what is already certain.",
      options: agreeOptions,
    },
    {
      id: "b652a9e4-c06d-4faa-947a-434f81bcea26",
      text: "You find it easy to stay relaxed and focused even when under pressure.",
      options: agreeOptions,
    },
    {
      id: "4205deb6-d5c1-404c-8289-5f5cdc568073",
      text: "You prefer to have a clear, detailed plan before starting a new project.",
      options: agreeOptions,
    },
    {
      id: "5008ddca-7a51-498c-a126-187dd45e5450",
      text: "You feel comfortable making important decisions based on feelings and values.",
      options: agreeOptions,
    },
    {
      id: "130b9384-67e2-48a1-8010-ac962b06ace5",
      text: "You often lose track of time when working on an interesting problem.",
      options: agreeOptions,
    },
    {
      id: "bade4aa8-9fad-49a7-a20f-b5d3f4dad547",
      text: "You prefer working in a team rather than working alone.",
      options: agreeOptions,
    },
    {
      id: "70625200-8b0f-449c-b2a7-da429ba0dd07",
      text: "You often make decisions based on objective data rather than gut feeling.",
      options: agreeOptions,
    },
    {
      id: "2b6ef689-4ed1-4f13-a9e7-d8d29500c952",
      text: "You enjoy having a to-do list and checking things off.",
      options: agreeOptions,
    },
    {
      id: "c7061f4a-ff70-47e3-a843-89906efa4303",
      text: "You find it easy to empathize with people whose experiences differ greatly from yours.",
      options: agreeOptions,
    },
    {
      id: "2aa39446-5c2a-471e-9bbd-cd460fd92a2d",
      text: "You like to keep your options open rather than settle on one plan.",
      options: agreeOptions,
    },
    {
      id: "d4629f56-1889-45f8-87e0-94331ae901c6",
      text: "You find small talk easy and enjoyable.",
      options: agreeOptions,
    },
  ],

  gpius2: [
    {
      id: "11935341-2391-4182-b43a-db1af38b91ed",
      text: "Saya lebih memilih interaksi sosial secara daring daripada komunikasi tatap muka.",
      options: gpius2Options,
      dimension: "POSI",
    },
    {
      id: "fb78e0c5-ffb5-4b2b-bfaa-486e334affb0",
      text: "Saya telah menggunakan internet untuk berbicara dengan orang lain ketika merasa terisolasi.",
      options: gpius2Options,
      dimension: "MR",
    },
    {
      id: "983e8cfa-d59c-4f33-8119-a5f38b2ed5f6",
      text: "Saya merasa asyik mengingat pengalaman daring saya sebelumnya.",
      options: gpius2Options,
      dimension: "CP",
    },
    {
      id: "9efa8684-f605-4b77-bd25-697b94a32531",
      text: "Saya merasa sulit mengendalikan penggunaan internet saya.",
      options: gpius2Options,
      dimension: "CU",
    },
    {
      id: "af1b08ce-816e-4d78-a71f-a9dd6488b60a",
      text: "Penggunaan internet saya telah menyebabkan saya menemui kesulitan.",
      options: gpius2Options,
      dimension: "NO",
    },
    {
      id: "fc7e5f9a-fb59-4bd9-9b24-41bdd551fbb4",
      text: "Saya lebih aman berinteraksi dengan orang lain secara daring ketimbang secara langsung.",
      options: gpius2Options,
      dimension: "POSI",
    },
    {
      id: "50bbea4d-62f9-4a09-a891-cc006443f3a7",
      text: "Saya telah menggunakan internet untuk merasa lebih baik ketika saya merasa sedih.",
      options: gpius2Options,
      dimension: "MR",
    },
    {
      id: "5ee76c40-eda5-4670-9764-feffc99d5281",
      text: "Saya berpikir secara obsesif tentang online.",
      options: gpius2Options,
      dimension: "CP",
    },
    {
      id: "c957d5f6-928f-4440-bfbf-174b6f45a292",
      text: "Saya merasa bersalah atas waktu yang saya habiskan di internet.",
      options: gpius2Options,
      dimension: "CU",
    },
    {
      id: "3e540c32-4e13-4cfb-b5a5-655687c502ec",
      text: "Penggunaan internet saya membuat saya sulit mengatur kehidupan saya.",
      options: gpius2Options,
      dimension: "NO",
    },
    {
      id: "49b04012-74d5-4eff-9db0-fd6c0c9878b7",
      text: "Saya lebih mudah untuk berkomunikasi dengan orang lain secara daring daripada secara langsung.",
      options: gpius2Options,
      dimension: "POSI",
    },
    {
      id: "23a96f42-0219-4df4-aa5e-0161f286c2e3",
      text: "Saya telah menggunakan internet untuk membuat diri saya merasa lebih baik ketika saya merasa kecewa.",
      options: gpius2Options,
      dimension: "MR",
    },
    {
      id: "b35d34cf-8efb-411f-b17d-791c174447ca",
      text: "Saya tidak bisa berhenti berpikir tentang menggunakan internet.",
      options: gpius2Options,
      dimension: "CP",
    },
    {
      id: "6ae81959-4437-4e19-be35-b9ac28a728e3",
      text: "Saya telah mencoba tanpa berhasil mengurangi berapa banyak waktu saya menggunakan internet.",
      options: gpius2Options,
      dimension: "CU",
    },
    {
      id: "1a52e5f0-9b04-4f83-a78b-be00675f3718",
      text: "Saya telah melewatkan acara sosial atau kegiatan karena penggunaan internet saya.",
      options: gpius2Options,
      dimension: "NO",
    },
  ],

  srs: [
    {
      id: "9a9fac9e-c4dc-416a-8ad4-cdc33c51d13f",
      text: "Saya merasa tidak mungkin bagi saya mencapai tujuan yang saya perjuangkan.",
      options: srsOptions,
      dimension: "Control",
      reversed: true,
    },
    {
      id: "a5586155-66e1-4178-ad6b-70b92cee7a7b",
      text: "Sejauh ini, saya sudah mendapatkan hal-hal penting yang saya inginkan dalam hidup.",
      options: srsOptions,
      dimension: "Satisfaction",
    },
    {
      id: "7accd869-f912-4276-94ba-b213720ca5f2",
      text: "Jika sesuatu yang salah dapat terjadi pada saya, maka hal itu akan terjadi.",
      options: srsOptions,
      dimension: "Control",
      reversed: true,
    },
    {
      id: "4a7d120e-91f5-45c4-89e8-a718cb773d52",
      text: "Saya puas dengan hidup saya.",
      options: srsOptions,
      dimension: "Satisfaction",
    },
    {
      id: "9a8b278c-7652-40e1-a82f-ffb48a3d75c3",
      text: "Apa yang terjadi dalam hidup saya sering kali berada di luar kendali saya.",
      options: srsOptions,
      dimension: "Control",
      reversed: true,
    },
    {
      id: "a488475e-00f0-44e6-a792-7ff3fa66014a",
      text: "Saya dapat melakukan hal-hal yang ingin saya lakukan.",
      options: srsOptions,
      dimension: "Efficacy",
    },
    {
      id: "b6718c48-6040-44ee-9ff4-1630423724d4",
      text: "Masa depan tampak tanpa harapan bagi saya dan saya tidak percaya bahwa segala sesuatu akan berubah menjadi lebih baik.",
      options: srsOptions,
      dimension: "Control",
      reversed: true,
    },
    {
      id: "60f000b2-2729-4635-9eb5-21905a661a59",
      text: "Ketika saya benar-benar ingin melakukan sesuatu, saya biasanya menemukan cara untuk berhasil melakukannya.",
      options: srsOptions,
      dimension: "Efficacy",
    },
    {
      id: "219464da-bd3e-4adf-8d15-68e5036d54b9",
      text: "Dalam banyak hal, hidup saya hampir mendekati ideal.",
      options: srsOptions,
      dimension: "Satisfaction",
    },
    {
      id: "5fa865a7-c593-4b00-a36a-734193962dcf",
      text: "Saya bisa melakukan apa saja yang saya inginkan.",
      options: srsOptions,
      dimension: "Efficacy",
    },
    {
      id: "e66536fa-20f3-4ad4-8a63-21350215ab74",
      text: "Tidak ada cara lain yang bisa saya lakukan untuk menyelesaikan masalah yang saya hadapi.",
      options: srsOptions,
      dimension: "Control",
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
