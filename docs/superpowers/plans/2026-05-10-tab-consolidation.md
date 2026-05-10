# Phase 3: Tab Consolidation Implementation Plan

## Task 1: Create QuestionManager component
- **New file:** `src/app/admin/(dashboard)/assessments/[id]/_components/QuestionManager.tsx`
- **Action:** Extract the question UI and logic from `questions/page.tsx`.
- **Requirements:**
  - Keep `useParams`, `getTestById` query, and page-level header (back nav, title, subtitle, status badge) in the original wrapper.
  - Define props: `{ testId: string, sessionCount: number }`.
  - Move the "Add Question" button into the `QuestionManager` top bar.
  - Derive `isLocked` internally via `sessionCount > 0`.
  - Retain all existing tRPC question hooks (`getQuestions`, `createQuestion`, `updateQuestion`, `deleteQuestion`) within the component.
- **Verification:** Run `npx tsc --noEmit` and `pnpm test` (expect 127 passing).

## Task 2: Thin-wrap the standalone questions page
- **Modify file:** `src/app/admin/(dashboard)/assessments/[id]/questions/page.tsx`
- **Action:** Remove extracted state, tRPC question hooks, and question UI.
- **Requirements:**
  - Keep `useParams` to extract `id`.
  - Keep `trpc.adminTests.getTestById.useQuery` for test metadata and `sessionCount`.
  - Keep the page-level header.
  - Replace the removed body with: `<QuestionManager testId={testId} sessionCount={testQuery.data?.sessionCount ?? 0} />`
- **Verification:** Run `npx tsc --noEmit` and `pnpm test`. Visually verify standalone route rendering in dev.

## Task 3: Wire QuestionManager into editor + add Scales tab
- **Modify file:** `src/app/admin/(dashboard)/assessments/[id]/page.tsx`
- **Action:** Extend editor tabs and embed `QuestionManager`.
- **Requirements:**
  - Import `QuestionManager`.
  - Extend `EditorTab` type: `"identity" | "questions" | "scales"`.
  - Rename tab labels to match Figma: "Identity", "Questions", "Scales".
  - Questions tab content: `<QuestionManager testId={testId} sessionCount={testQuery.data?.sessionCount ?? 0} />`
  - Scales tab content: a placeholder card (styled with DesignTokens) displaying Title "Scale Management", body "Configure score ranges and interpretations for each subscale.", and note "Coming in 1D.11".
- **Verification:** Run `npx tsc --noEmit` and `pnpm test`.

## Task 4: Integration verification + Phase 6 review
- **Verification steps:**
  - `npx tsc --noEmit` returns 0 errors.
  - `pnpm lint` returns 0 errors.
  - `pnpm test` confirms all 127 tests pass.
  - Spec compliance checklist (Extraction complete, wrapper functional, editor wired, Scales placeholder added, tab labels updated).
- **Completion:** Proceed to Phase 7 and prepare for merge to master.
