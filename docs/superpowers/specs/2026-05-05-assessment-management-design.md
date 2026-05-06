# 1D.7 Assessment Management — Design Specification

> **Date:** 2026-05-05
> **Status:** APPROVED — all sections reviewed and locked
> **Scope:** Test-level CRUD only. Question Management (1D.8) and Scale Management (1D.9) are deferred.
> **Branch:** TBD (to be created in Phase 2: ISOLATE)

---

## Understanding Summary

- **What:** Admin CRUD interface for psychometric test lifecycle management — list all instruments, create draft test shells, edit metadata/structural fields (with hard-lock enforcement), and manage `draft → published → archived` state transitions.
- **Why:** Admins currently cannot add, modify, or retire instruments without direct DB access or code changes. This feature gives non-engineering staff a governed, safety-constrained panel for test administration.
- **Who:** Admin users authenticated via the existing custom JWT system (`adminProcedure` / `adminMutationProcedure`).
- **Key constraints:** Structural field hard-lock, state machine with publish gate, cascading delete only on zero-session drafts, audit trail on all destructive operations.
- **Non-goals:** Question authoring (1D.8), Scale/option authoring (1D.9), automated versioning, pagination, instrument type taxonomy, configurable publish thresholds.

---

## Assumptions

1. Instrument count will remain under 50 for the foreseeable future (single university deployment). No pagination needed.
2. Client-side search/filter is acceptable at this data scale — no debounced tRPC calls required.
3. The existing admin CSS design system (`src/app/admin/admin.css`) and shadcn component library are sufficient — no new design tokens required.
4. `version` column on `tests` table is vestigial and will not be touched (flagged for future housekeeping).
5. All admin navigation uses `window.location.href` (never `useRouter`) per the established httpOnly cookie integrity rule.

---

## Decision Log

### D1 — Mutation Safety Model
- **Decision:** Hard lock on structural fields once `session_count ≥ 1`
- **Alternatives:** Soft lock with confirmation modal; automated versioning
- **Rationale:** Clinical instruments are externally validated — structure must never change post-publication. Soft-lock gates damage behind a click. Versioning is over-engineering (YAGNI).

### D2 — State Machine
- **Decision:** `draft → published → archived` with explicit transition rules
- **Full rules:**
  - `draft → published`: allowed only if `question_count ≥ 1`
  - `published → archived`: always allowed (preserves all session data, sets `isActive = false`)
  - `published → draft`: BLOCKED if any `test_session` exists
  - `archived → draft`: allowed only if `session_count = 0` (i.e. never had sessions)
  - `archived → published`: BLOCKED — must go through draft first
- **Alternatives:** Boolean `is_published` (current); 4-state with `review` step
- **Rationale:** Three states model the full lifecycle without speculative complexity. Explicit guards prevent data-destructive state regressions.

### D3 — Create Form Scope
- **Decision:** Metadata only — 7 fields total. No question count declaration, no instrument type taxonomy.
- **Field classification:**
  - Structural (Tier 1): `slug`, `scoringMethod`
  - Metadata (Tier 2): `title`, `description`, `instructions`, `estimatedMinutes`, `thumbnailUrl`
  - System-controlled: `status` (draft), `isActive` (true), `category` ('general')
- **Alternatives:** Metadata + question count; metadata + instrument type dropdown
- **Rationale:** Question count is derivable via COUNT(). Instrument type requires a migration for a feature not in scope. YAGNI.

### D4 — Slug Behavior
- **Decision:** Auto-generated from title (debounced 300ms), manually overridable, unique constraint enforced in real-time via `checkSlugUnique` tRPC query.
- **Rationale:** Predictable URLs from titles; real-time feedback prevents submit failures.

### D5 — Hard Delete Policy
- **Decision:** Delete permitted only on `draft` tests with `session_count = 0`.
- **Cascade:** `tests → questions → options` (FK cascade already exists in schema)
- **Audit:** Every deletion writes to `audit_logs` with entity snapshot in `oldValue`.
- **UI:** Delete button absent (not disabled) on non-draft tests. Simple confirmation modal — no slug-typing.
- **Alternatives:** No delete ever; delete any status with type-to-confirm
- **Rationale:** Zero-session drafts carry no clinical data — permanent removal is safe and prevents slug namespace pollution. Cascade delete on published tests risks irreversible clinical data loss.

### D6 — List View Design
- **Decision:** Full table with search + status filter tabs, no pagination.
- **Columns:** Title, Slug, Scoring Method badge, Status badge, Session Count (amber when > 0), Created At (relative), Actions (contextual per status).
- **Alternatives:** Minimal table; category grouping
- **Rationale:** Search + filter covers discovery. Grouping by scoring method doesn't match clinical taxonomy. Pagination is YAGNI at < 50 instruments.

### D7 — Architecture Pattern
- **Decision:** Hybrid — Sheet for Create, `[id]` route for Edit.
- **Create:** shadcn Sheet, 480px, URL-param controlled (`?mode=create`)
- **Edit:** Full page at `/assessments/[id]`, Server Component + EditForm Client Component
- **Status transitions:** Inline confirmation dialogs from list row (no navigation)
- **Alternatives:** Single route + Sheet for both; separate routes for both; inline table forms
- **Rationale:** Create is a bounded 7-field interaction (Sheet is correct). Edit must display lock state, field-level read-only enforcement, and will grow tabs for 1D.8. Sheet cannot host tabs.

### D8 — scoring_method Placement
- **Decision:** New `scoring_method` column on `tests` table (separate from `scoring_rules.algorithm`)
- **Rationale:** Different abstraction layers with different consumers. `scoring_rules.algorithm` serves the runtime engine; `tests.scoring_method` serves admin classification at authoring time. Not redundancy — different vocabularies.

### D9 — category Field Handling
- **Decision:** DB default set to `'general'` via migration. Hidden from all admin UI.
- **Rationale:** Free-text category produces inconsistent data. Proper controlled vocabulary is a future-phase feature.

---

## Schema Migration

### New Enums
```sql
CREATE TYPE test_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE scoring_method AS ENUM ('summative', 'dimensional', 'binary_cluster');
```

### Column Changes to `tests`
| Action | Column | Type | Constraint |
|---|---|---|---|
| ADD | `status` | `test_status` | NOT NULL DEFAULT 'draft' |
| ADD | `scoring_method` | `scoring_method` | NOT NULL (after backfill) |
| ADD | `instructions` | TEXT | nullable |
| ADD | `thumbnail_url` | TEXT | nullable |
| ADD | `is_active` | BOOLEAN | NOT NULL DEFAULT true |
| ALTER | `category` | TEXT | SET DEFAULT 'general' |
| ALTER | `estimated_minutes` | INTEGER | Remove NOT NULL (make optional) |
| DROP | `is_published` | BOOLEAN | After backfill to `status` |
| ADD INDEX | `idx_tests_status` | — | replaces `idx_tests_is_published` |
| ADD INDEX | `idx_tests_is_active` | — | new |

### Two-Pass Migration
1. Push schema with `scoringMethod` temporarily nullable → backfill → push again with NOT NULL
2. Breaking change audit: all files referencing `isPublished` must be patched atomically
3. Seed script updated: `isPublished: true` → `status: 'published'`, `scoringMethod` set per instrument

### Backfill SQL
```sql
UPDATE tests SET status = CASE WHEN is_published = true THEN 'published' ELSE 'draft' END;
UPDATE tests SET scoring_method = 'summative' WHERE slug IN ('pss-10', 'srs');
UPDATE tests SET scoring_method = 'dimensional' WHERE slug IN ('gpius-2', 'mbti');
UPDATE tests SET scoring_method = 'binary_cluster' WHERE slug = 'srq-29';
```

---

## tRPC Procedures (8 total in `assessments.ts`)

### Queries (adminProcedure)
- `getTests` — list with LEFT JOIN `countDistinct` for sessionCount and questionCount
- `getTestById` — single test fetch (for edit page + future 1D.8)
- `checkSlugUnique` — real-time slug validation with `excludeId` for edit mode

### Mutations (adminMutationProcedure)
- `createTest` — enforces slug uniqueness, sets `status: 'draft'`, `isActive: true`, `category: 'general'`; writes audit log
- `updateTest` — structural lock guard (PRECONDITION_FAILED if sessionCount > 0 and structural fields touched)
- `publishTest` — validates `status === 'draft'` AND `questionCount ≥ 1`
- `archiveTest` — validates `status === 'published'`, sets `isActive = false`
- `deleteTest` — validates `status === 'draft'` AND `sessionCount === 0`; transaction: delete + audit log with snapshot

### Audit Log Field Mapping
- `adminUserId` ← `ctx.adminSession.id`
- `entityType` ← `"test"`
- `entityId` ← test UUID
- `oldValue` ← snapshot jsonb (on delete/update)
- `newValue` ← new values jsonb (on create/update), null on delete

---

## UI Components

### File Structure
```
/admin/(dashboard)/assessments/
├── page.tsx                          ← Server Component (list + initial data)
│   └── _components/
│       ├── AssessmentTable.tsx       ← Client (table, search, filter tabs)
│       ├── CreateSheet.tsx           ← Client (Sheet: create form)
│       ├── StatusActions.tsx         ← Client (publish/archive/delete + dialogs)
│       └── types.ts                  ← TestRow, CreateFormValues types
└── [id]/
    ├── page.tsx                      ← Server Component (fetch test by id)
    └── _components/
        └── EditForm.tsx              ← Client (edit form, field locking)
```

### Key Behaviors
- **Slug auto-generation:** debounced 300ms from title, real-time uniqueness check
- **Structural lock:** `isLocked = test.sessionCount > 0` — structural fields render as static `<p>` text (not disabled inputs)
- **Lock banner:** amber warning when isLocked, shown at top of edit form
- **Publish checklist:** Two items: title/description present + questionCount ≥ 1
- **Delete button:** absent (not disabled) on non-draft tests
- **Edit navigation:** `window.location.href` (never `router.push`)
- **All mutation onSuccess:** `router.refresh()` (never `window.location.reload()`)
- **countDistinct:** MUST use `countDistinct` for both sessionCount and questionCount to prevent Cartesian product inflation from double LEFT JOIN
- **PRECONDITION_FAILED handler:** EditForm's updateTest onError catches race condition where sessions are recorded between page load and save, re-derives isLocked via router.refresh()

---

## Testing Strategy (TDD)

### Guard Logic Unit Tests (RED first)
- createTest: slug collision → CONFLICT
- updateTest: structural edit on locked test → PRECONDITION_FAILED
- updateTest: metadata edit on locked test → success
- publishTest: draft with 0 questions → PRECONDITION_FAILED
- publishTest: draft with ≥1 question → success
- publishTest: non-draft → PRECONDITION_FAILED
- archiveTest: non-published → PRECONDITION_FAILED
- archiveTest: published → success, isActive set to false
- deleteTest: non-draft → PRECONDITION_FAILED
- deleteTest: draft with sessions → PRECONDITION_FAILED
- deleteTest: draft, 0 sessions → success + audit log written
- checkSlugUnique: existing slug → { isUnique: false }
- checkSlugUnique: with excludeId (self) → { isUnique: true }

---

*End of design specification. All sections reviewed and approved with fixes applied.*
