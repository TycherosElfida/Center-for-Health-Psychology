# Implementation Plan: 1D.9 Assessment Identity Fields

## Task 0: validation_source audit + CreatableSelect component
- **Audit Result**: Grep search on `drizzle/` migrations found no reference to `validation_source`. It is an orphaned column in the live DB. We will ignore it; Drizzle will not drop it since `strict: true` is configured without destructive sync mode.
- **Action**: Create `src/app/admin/(dashboard)/assessments/_components/CreatableSelect.tsx`.
- **Implementation**: Implement a reusable `CreatableSelect` component exported as a named export. It will feature an `<input>` and absolute dropdown list, keyboard navigation, and the ability to add new options inline.
- **Constraint**: ≤ 100 lines.

## Task 1: Drizzle schema changes + migration SQL (STOP for review)
- **Action**: Update `src/server/schema/tests.ts`.
- **Changes**: Add `abbreviation` (text, notNull, default ""), `releaseYear` (integer), and `author` (text).
- **Action**: Generate the Drizzle migration using `pnpm db:generate`.
- **Checkpoint**: STOP and present raw SQL to the user for explicit confirmation before applying.
- **Constraint**: ≤ 100 lines.

## Task 2: tRPC procedure updates (Zod schemas + DB mappings + getCategories) — TDD
- **Action**: Update `src/__tests__/admin-tests/admin-tests.test.ts` with 5 new tests (Full creation, validation, required update, optional clear, and getCategories query) and ensure they fail (RED phase).
- **Action**: Update `src/server/trpc/procedures/admin-tests.ts`.
- **Changes**: 
  - `createTestSchema` / `updateTestSchema` (using dynamic `new Date().getFullYear()`).
  - Map new fields in `createTest` and `updateTest` mutations.
  - Return new fields in `getTestById` and `getTests`.
  - Add `getCategories` query using `selectDistinct`.
- **Validation**: Ensure tests pass (GREEN phase) and refactor (REFACTOR phase).
- **Constraint**: ≤ 100 lines.

## Task 3: Editor Identity form (4 fields)
- **Action**: Update `src/app/admin/(dashboard)/assessments/[id]/page.tsx`.
- **Changes**:
  - Add standard inputs for `abbreviation`, `author`, `releaseYear`.
  - Replace current category input with `CreatableSelect` imported from `_components/CreatableSelect.tsx`.
  - Fetch categories via `trpc.adminTests.getCategories.useQuery`.
- **Constraint**: ≤ 100 lines.

## Task 4: CreateTestSheet (abbreviation + category)
- **Action**: Update `src/app/admin/(dashboard)/assessments/_components/CreateTestSheet.tsx`.
- **Changes**:
  - Add `abbreviation` required input.
  - Replace current category input with `CreatableSelect`.
  - Pass the fetched categories to it.
- **Constraint**: ≤ 100 lines.

## Task 5: Integration verification
- **Action**: Run the complete test suite `pnpm test` to verify all components and procedures integrate flawlessly without regressions.
- **Action**: Verify database integrity post-migration manually via Neon.
- **Constraint**: Execution and reporting phase.
