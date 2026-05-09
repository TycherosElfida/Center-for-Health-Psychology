# Assessment UI Remake — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Assessment Management UI (list + editor + CreateTestSheet + StatusActions) to match the DesignReference visual language — premium feel, consistent tokens, hover/transition polish.

**Architecture:** Pure CSS-in-JS restyle with shared design token constants. No new backend code. The existing tRPC hooks remain untouched. Tab consolidation on the editor page uses `?tab=` query param for state. All new CSS animations go into `admin.css`.

**Tech Stack:** Next.js 16 (App Router), React 19, tRPC v11, Lucide icons, `@dnd-kit`, vanilla CSS.

**Branch:** `assessment-ui-remake` (worktree: `.worktrees/assessment-management`)

**Baseline:** 110 tests passing on master.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/admin/admin.css` | Modify | Add animation keyframes + utility classes |
| `src/app/admin/_components/DesignTokens.ts` | Create | Shared palette, typography, component factories |
| `src/app/admin/(dashboard)/assessments/page.tsx` | Modify | List page restyle |
| `src/app/admin/(dashboard)/assessments/_components/CreateTestSheet.tsx` | Modify | Sheet panel restyle |
| `src/app/admin/(dashboard)/assessments/_components/StatusActions.tsx` | Modify | Action buttons restyle |
| `src/app/admin/(dashboard)/assessments/[id]/page.tsx` | Modify | Editor page + tab shell |

---

## Task 1: Shared Design Tokens Module

**Files:**
- Create: `src/app/admin/_components/DesignTokens.ts`

- [ ] **Step 1: Create the design tokens file**

```typescript
// src/app/admin/_components/DesignTokens.ts

/**
 * Shared Design Tokens for CHP Admin Panel
 *
 * Extracted from DesignReference/AssessmentManagementPage.tsx palette.
 * Single source of truth — every admin component imports from here.
 */

/* ── Palette ─────────────────────────────────────────────────── */
export const BRAND = "#9B8EC4";
export const BRAND_DEEP = "#6B5CA0";
export const BRAND_LIGHT = "#EDE9F8";
export const BRAND_BG = "#F5F3FA";

export const WHITE = "#FFFFFF";
export const DARK_TEXT = "#1A202C";
export const MID_TEXT = "#4A5568";
export const LIGHT_TEXT = "#718096";
export const BORDER = "#E2DCF0";

export const RED = "#E53E3E";
export const RED_LIGHT = "#FFF5F5";
export const RED_BORDER = "#FED7D7";

export const GREEN = "#2E7D32";
export const GREEN_LIGHT = "#E8F5E9";
export const GREEN_BORDER = "#A5D6A7";

export const YELLOW = "#D69E2E";
export const WARNING = "#E65100";
export const WARNING_BG = "#FFF3E0";
export const WARNING_BORDER = "#FFE0B2";

/* ── Status Badge Config ────────────────────────────────────── */
export const STATUS_CONFIG = {
  draft: { label: "Draft", bg: "#F0EDF5", color: BRAND_DEEP, border: "#D6CEE8" },
  published: { label: "Published", bg: GREEN_LIGHT, color: GREEN, border: GREEN_BORDER },
  archived: { label: "Archived", bg: "#F5F5F5", color: "#757575", border: "#E0E0E0" },
} as const;

/* ── Scoring Method Config ──────────────────────────────────── */
export const SCORING_LABELS: Record<string, string> = {
  summative: "Summative",
  dimensional: "Dimensional",
  binary_cluster: "Binary Cluster",
};

/* ── Shared Input Style ─────────────────────────────────────── */
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 14px",
  borderRadius: 10,
  border: `1.5px solid ${BORDER}`,
  background: WHITE,
  fontSize: 13,
  color: DARK_TEXT,
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  fontFamily: "'Inter', sans-serif",
};

/* ── Shared Label Style ─────────────────────────────────────── */
export const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  fontWeight: 700,
  color: MID_TEXT,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

/* ── Focus/Blur Handlers ────────────────────────────────────── */
export function onInputFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = BRAND;
  e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND}15`;
}
export function onInputBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = BORDER;
  e.currentTarget.style.boxShadow = "none";
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx pnpm exec tsc --noEmit --pretty 2>&1 | Select-String "error" | Select-Object -First 5`
Expected: No errors referencing DesignTokens.ts

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/_components/DesignTokens.ts
git commit -m "feat(admin): add shared design tokens module for UI remake"
```

---

## Task 2: CSS Animation Foundation

**Files:**
- Modify: `src/app/admin/admin.css` (append ~80 lines)

- [ ] **Step 1: Add animation keyframes and utility classes**

Append to `admin.css` after the existing `.test-editor-tab--active::after` block:

```css
/* ═══════════════════════════════════════════════════════════════
 * Assessment UI Remake — Animation Foundation
 * ═══════════════════════════════════════════════════════════════ */

/* ── Row hover lift ─────────────────────────────────────────── */
.admin-row-hover {
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.admin-row-hover:hover {
  background: rgba(155, 142, 196, 0.04) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(155, 142, 196, 0.08);
}

/* ── Card expand/collapse ───────────────────────────────────── */
@keyframes adminExpandIn {
  from { opacity: 0; max-height: 0; transform: translateY(-4px); }
  to { opacity: 1; max-height: 600px; transform: translateY(0); }
}

.admin-expand-in {
  animation: adminExpandIn 0.2s ease-out both;
  overflow: hidden;
}

/* ── Tab indicator slide ────────────────────────────────────── */
.admin-tab {
  position: relative;
  transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.admin-tab--active {
  background: #FFFFFF;
  color: #6B5CA0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ── Pill component ─────────────────────────────────────────── */
.admin-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  transition: transform 0.1s ease;
}

/* ── Button base (gradient primary) ─────────────────────────── */
.admin-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #9B8EC4, #6B5CA0);
  color: #FFFFFF;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
  box-shadow: 0 2px 12px rgba(155, 142, 196, 0.35);
}

.admin-btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.admin-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ── Button secondary (outlined) ────────────────────────────── */
.admin-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #E2DCF0;
  background: #FFFFFF;
  color: #4A5568;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-btn-secondary:hover {
  border-color: #9B8EC4;
  color: #6B5CA0;
  background: rgba(155, 142, 196, 0.04);
}

/* ── Button danger ──────────────────────────────────────────── */
.admin-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #FED7D7;
  background: #FFF5F5;
  color: #E53E3E;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-btn-danger:hover {
  background: #FEE;
  border-color: #FC8181;
}

/* ── Button ghost ───────────────────────────────────────────── */
.admin-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #718096;
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-btn-ghost:hover {
  background: rgba(155, 142, 196, 0.08);
  color: #6B5CA0;
}

/* ── Success flash ──────────────────────────────────────────── */
@keyframes adminSuccessFlash {
  0% { opacity: 0; transform: translateY(-4px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

.admin-success-flash {
  animation: adminSuccessFlash 2.5s ease both;
}
```

- [ ] **Step 2: Verify CSS loads without parse errors**

Run: `npx pnpm run dev` — check terminal for CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/admin.css
git commit -m "feat(admin): add animation foundation CSS for UI remake"
```

---

## Task 3: List Page Restyle

**Files:**
- Modify: `src/app/admin/(dashboard)/assessments/page.tsx`

**Goal:** Replace inline DT constants with imported tokens, apply DesignReference table styling (pill tabs, row hover lift, consistent pill badges).

- [ ] **Step 1: Swap token imports**

Replace the local `DT` const and `STATUS_CONFIG` / `SCORING_CONFIG` blocks (lines 15-41) with:

```typescript
import {
  BRAND, BRAND_DEEP, BRAND_LIGHT, BRAND_BG,
  WHITE, DARK_TEXT, MID_TEXT, LIGHT_TEXT, BORDER,
  RED, WARNING, STATUS_CONFIG, SCORING_LABELS,
} from "../_components/DesignTokens";
```

Remove the old `DT`, `STATUS_CONFIG`, and `SCORING_CONFIG` const blocks entirely. Replace all references from `DT.DARK_TEXT` to `DARK_TEXT`, `DT.BRAND` to `BRAND`, etc.

- [ ] **Step 2: Update the page header**

Replace the current header section with the DesignReference pattern:
- h1: `fontFamily: "'DM Sans', sans-serif"`, `fontWeight: 700`, `fontSize: 20`, `color: DARK_TEXT`
- Subtitle: `fontSize: 12`, `color: LIGHT_TEXT`
- Button: use `className="admin-btn-primary"` instead of inline gradient styles

- [ ] **Step 3: Update status filter tabs**

Replace the current inline-styled tab buttons with the DesignReference pill-tab pattern:
- Container: `background: "#F0EDF6"`, `borderRadius: 12`, `padding: 4`, `display: "flex"`, `gap: 4`
- Active tab: `className="admin-tab admin-tab--active"`, `fontWeight: 700`
- Inactive tab: `className="admin-tab"`, `background: "transparent"`, `color: LIGHT_TEXT`
- Count badge: `background: isActive ? BRAND_LIGHT : "#F0EDF5"`

- [ ] **Step 4: Update the data table**

Apply DesignReference table patterns:
- Convert div-grid to `<table>` with `colgroup`, `thead`, `tbody`
- Header row: `background: "#F9F7FD"`, uppercase 10px labels
- Body `<tr>`: add `className="admin-row-hover"`, cursor pointer
- Status pills: `className="admin-pill"` with `STATUS_CONFIG` colors
- Slug badge: monospace font, `#F0EDF5` background, `6px` borderRadius

- [ ] **Step 5: Verify page renders and tests pass**

Run: `npx pnpm test -- --reporter=verbose 2>&1 | Select-Object -Last 10`
Expected: 110 tests passing

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/(dashboard)/assessments/page.tsx
git commit -m "feat(admin): restyle assessment list page to match design reference"
```

---

## Task 4: StatusActions Restyle

**Files:**
- Modify: `src/app/admin/(dashboard)/assessments/_components/StatusActions.tsx`

**Goal:** Update button styling to use shared tokens and CSS classes. Preserve all tRPC mutation hooks unchanged.

- [ ] **Step 1: Import shared tokens**

Replace any local color constants with imports from `DesignTokens.ts`.

- [ ] **Step 2: Update button styles**

Apply CSS class patterns:
- Publish button: `className="admin-btn-primary"`
- Archive button: `className="admin-btn-secondary"`
- Delete/danger buttons: `className="admin-btn-danger"`
- Ghost actions: `className="admin-btn-ghost"`
- Remove all inline gradient/transition styles that are now handled by CSS classes

- [ ] **Step 3: Update confirmation dialog styling**

If modal/dialog elements exist, ensure they use token-consistent backgrounds (`WHITE`, `BORDER`, `RED_LIGHT` for danger zone).

- [ ] **Step 4: Verify and commit**

Run: `npx pnpm test -- --reporter=verbose 2>&1 | Select-Object -Last 10`
Expected: 110 tests passing

```bash
git add src/app/admin/(dashboard)/assessments/_components/StatusActions.tsx
git commit -m "feat(admin): restyle StatusActions with design reference tokens"
```

---

## Task 5: CreateTestSheet Restyle

**Files:**
- Modify: `src/app/admin/(dashboard)/assessments/_components/CreateTestSheet.tsx`

**Goal:** Update the slide-over panel to use shared tokens and DesignReference form patterns.

- [ ] **Step 1: Import shared tokens and styles**

Replace local color constants with imports from `DesignTokens.ts`. Use `inputStyle`, `labelStyle`, `onInputFocus`, `onInputBlur`.

- [ ] **Step 2: Update panel container**

Apply DesignReference panel patterns:
- Panel background: `WHITE`
- Border-left: `1px solid ${BORDER}`
- Header: `fontFamily: "'DM Sans', sans-serif"`, `fontWeight: 700`, title text in `DARK_TEXT`
- Close button: `className="admin-btn-ghost"`

- [ ] **Step 3: Update form fields**

Replace all input/select/textarea inline styles with shared `inputStyle`. Apply `onInputFocus`/`onInputBlur` handlers. Use `labelStyle` for all labels.

- [ ] **Step 4: Update submit button**

Use `className="admin-btn-primary"` pattern.

- [ ] **Step 5: Verify and commit**

Run: `npx pnpm test -- --reporter=verbose 2>&1 | Select-Object -Last 10`
Expected: 110 tests passing

```bash
git add src/app/admin/(dashboard)/assessments/_components/CreateTestSheet.tsx
git commit -m "feat(admin): restyle CreateTestSheet with design reference tokens"
```

---

## Task 6: Editor Page — Top Bar + Form Restyle

**Files:**
- Modify: `src/app/admin/(dashboard)/assessments/[id]/page.tsx`

**Goal:** Phase 1 of editor restyle — update top bar, structural lock warning, form fields, and submit area. Do NOT add tabs yet (that's Task 7).

- [ ] **Step 1: Import shared tokens**

Replace local `DT` and `STATUS_CONFIG` with imports from `DesignTokens.ts`. Replace all `DT.X` references with direct imports.

- [ ] **Step 2: Update top bar**

Apply DesignReference `MasterEditor` top bar pattern:
- Back button: `className="admin-btn-secondary"`
- Title: `fontFamily: "'DM Sans', sans-serif"`, `fontWeight: 700`, `fontSize: 18`, `color: DARK_TEXT`
- Status pill: `className="admin-pill"`
- Session/question count badges: use token colors (`WARNING_BG`, `WARNING_BORDER`, etc.)

- [ ] **Step 3: Update structural lock warning**

Use `WARNING_BG` (#FFF3E0), `WARNING_BORDER` (#FFE0B2), and `WARNING` (#E65100) tokens.

- [ ] **Step 4: Update form container and fields**

- Form card: `borderRadius: 14`, `padding: 28`, `border: 1px solid ${BORDER}`
- All inputs: shared `inputStyle` with `onInputFocus`/`onInputBlur`
- Labels: shared `labelStyle`
- Submit button: `className="admin-btn-primary"`

- [ ] **Step 5: Verify and commit**

Run: `npx pnpm test -- --reporter=verbose 2>&1 | Select-Object -Last 10`
Expected: 110 tests passing

```bash
git add src/app/admin/(dashboard)/assessments/[id]/page.tsx
git commit -m "feat(admin): restyle editor top bar and form fields"
```

---

## Task 7: Editor Page — Tab Shell Integration

**Files:**
- Modify: `src/app/admin/(dashboard)/assessments/[id]/page.tsx`

**Goal:** Add in-page tab system with two tabs: "Identity & Metadata" (existing form) and "Questions" (existing QuestionList). Tab state uses `?tab=` query param.

- [ ] **Step 1: Add tab state and URL sync**

```typescript
import { useSearchParams } from "next/navigation";

// Inside the component, after testQuery:
const searchParams = useSearchParams();
const activeTab = (searchParams.get("tab") ?? "identity") as "identity" | "questions";
```

For tab switching, use `window.history.replaceState` to avoid full navigation:

```typescript
function setTab(tab: "identity" | "questions") {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  window.history.replaceState({}, "", url.toString());
  // Force re-render via local state mirror
  setActiveTabLocal(tab);
}
const [activeTabLocal, setActiveTabLocal] = useState(activeTab);
```

- [ ] **Step 2: Add tab bar UI**

After the top bar (and structural lock warning), insert the tab bar. Use the `admin-tab` and `admin-tab--active` CSS classes.

```tsx
<div style={{
  display: "flex",
  gap: 4,
  marginBottom: 20,
  background: "#F0EDF6",
  borderRadius: 12,
  padding: 4,
}}>
  {([
    { id: "identity" as const, label: "Identity & Metadata", icon: FileText },
    { id: "questions" as const, label: "Questions", icon: ListOrdered },
  ]).map((t) => (
    <button
      key={t.id}
      onClick={() => setTab(t.id)}
      className={`admin-tab ${activeTabLocal === t.id ? "admin-tab--active" : ""}`}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 16px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        fontSize: 12.5,
        fontWeight: activeTabLocal === t.id ? 700 : 500,
        color: activeTabLocal === t.id ? BRAND_DEEP : LIGHT_TEXT,
      }}
    >
      <t.icon size={14} />
      {t.label}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Conditionally render tab content**

Wrap the existing `<form>` and metadata footer in `{activeTabLocal === "identity" && (...)}`.

For the questions tab, dynamically import the existing QuestionList:

```tsx
{activeTabLocal === "questions" && (
  <div style={{
    background: WHITE,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    padding: 24,
  }}>
    <QuestionListInline testId={testId} isLocked={isStructurallyLocked} />
  </div>
)}
```

Create a lightweight `QuestionListInline` component that uses the existing `trpc.adminQuestions.getQuestions` query and renders question cards matching the DesignReference expand/collapse pattern.

- [ ] **Step 4: Add `ListOrdered` to lucide-react imports**

Ensure `ListOrdered` is imported at the top of the file.

- [ ] **Step 5: Verify and commit**

Run: `npx pnpm test -- --reporter=verbose 2>&1 | Select-Object -Last 10`
Expected: 110 tests passing

```bash
git add src/app/admin/(dashboard)/assessments/[id]/page.tsx
git commit -m "feat(admin): add in-page tab shell with Identity + Questions tabs"
```

---

## Task 8: Final Integration Verification

**Files:** None modified — verification only.

- [ ] **Step 1: Run full test suite**

Run: `npx pnpm test -- --reporter=verbose`
Expected: 110 tests passing (same baseline)

- [ ] **Step 2: Run type check**

Run: `npx pnpm exec tsc --noEmit --pretty`
Expected: 0 errors

- [ ] **Step 3: Visual verification checklist**

Start dev server: `npx pnpm run dev`

Verify these pages render correctly:
1. `/admin/assessments` — list page with pill tabs, styled table, row hover effects
2. `/admin/assessments/{id}` — editor with tab bar, Identity form restyled
3. `/admin/assessments/{id}?tab=questions` — Questions tab renders question list
4. Create New Assessment flow — CreateTestSheet slide-over opens, form renders
5. Status actions (publish/archive) — buttons styled with correct variants

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore(admin): final integration fixes for UI remake"
```

---

## Decision Log

| # | Decision | Alternatives | Rationale |
|---|----------|-------------|-----------|
| 1 | Shared `DesignTokens.ts` module | Inline constants per file | DRY — 6 files share the same palette. Single source of truth. |
| 2 | CSS classes for animations | Inline style transitions only | CSS classes enable pseudo-selectors (`:hover`, `::after`) which inline styles cannot. |
| 3 | `?tab=` query param for tab state | `useState` only | URL persistence enables deep-linking and browser back/forward. |
| 4 | Keep `@dnd-kit` | Switch to `react-dnd` | Existing codebase investment; no benefit from switching. |
| 5 | `<table>` element for list page | CSS Grid div layout | Semantic HTML; matches DesignReference; better accessibility. |
| 6 | Inline QuestionList in tab | Route-based only | Consolidates editor into single page; keeps route as fallback. |
