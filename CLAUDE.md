# CHP Digital Assessment Platform

Clinical psychology SaaS for the Center for Health Psychology (CHP), UKRIDA Jakarta. Delivers validated psychometric instruments (PSS-10, GPIUS-2, SRS, SRQ-29), computes clinical scores, and produces interpretive reports.

## Tech Stack

- Next.js 16.2.4 (App Router) · TypeScript 6.0.3 (strict) · React 19.2.5 (with Compiler)
- Tailwind CSS 4.2.4 (`@theme inline`, oklch) · shadcn/ui · Motion
- Neon PostgreSQL · Drizzle ORM 1.0.0-beta.20 · tRPC v11.16.0
- Auth.js v5 (users) · Custom JWT via `jose` (admin) — **separate systems, do not mix**
- Upstash Redis (rate limiting) · Sentry (observability) · Resend (email) · Vitest 4.1.5

> **WARNING:** Next.js 16, TypeScript 6, React 19, Tailwind 4, and Drizzle 1.0-beta are all beyond typical training data. Read `node_modules/next/dist/docs/` before writing any framework code.

## Key Paths

```
src/server/schema/          → Drizzle schema (13 modules, 16 tables)
src/server/scoring/         → Pure scoring engine (engine.ts, interpretation.ts, validation.ts)
src/server/trpc/procedures/ → tRPC procedures (8 files)
src/server/reports/         → PDF generation
src/app/admin/              → Admin panel (separate auth from user auth)
src/components/ui/          → shadcn/ui components
src/__tests__/              → Vitest test suites (97+ tests passing)
DesignReference/            → Figma-exported Vite prototype (canonical design truth)
docs/superpowers/specs/     → Design specifications
docs/superpowers/plans/     → Implementation plans
```

## Code Style

- Use ES modules (import/export), not CommonJS
- Destructure imports when possible
- Prefer `pnpm` for all package operations
- Run `pnpm test` to verify after changes, prefer single test files over full suite
- Run `pnpm lint` and typecheck after a series of code changes

## Project Rules

1. Admin auth and user auth are SEPARATE systems — never cross them
2. Admin navigation uses `window.location.href`, not Next.js `<Link>`
3. The scoring engine (`src/server/scoring/engine.ts`) is PURE — no side effects, no DB calls inside `computeScore()`
4. Check the Figma design reference in `DesignReference/src/app/pages/` before building UI
5. Read the relevant design spec in `docs/superpowers/specs/` before implementing any feature

## When Compacting

Always preserve: list of modified files, test commands used, current task progress, and any design spec references.

---

# Behavioral Guidelines

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State assumptions explicitly. If uncertain, ask — don't guess.
- If multiple interpretations exist, present them. Don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

**The test:** Would a senior engineer say this is overcomplicated? If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** Every changed line traces directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → Write tests for invalid inputs, then make them pass
- "Fix the bug" → Write a test that reproduces it, then make it pass
- "Refactor X" → Ensure tests pass before and after

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

## 5. Verify Before Declaring Done

- Always provide a way to verify work: run tests, execute scripts, check output.
- If you can't verify it, don't declare it done.
- Run the relevant test suite after making changes, not just assume correctness.

---

# Development Workflow (Mandatory)

All constructive work (features, bug fixes, refactors) MUST follow this phased workflow. No exceptions.

## Phase Gates

| # | Phase | Gate |
|---|---|---|
| 1 | **Brainstorm** | Design spec written + user approved |
| 2 | **Isolate** | Git worktree/branch created, baseline tests passing |
| 3 | **Plan** | Bite-sized implementation plan approved |
| 4 | **Execute** | Per-task TDD with two-stage review |
| 5 | **TDD** | RED → GREEN → REFACTOR per task |
| 6 | **Review** | Spec compliance ✅ then code quality ✅ |
| 7 | **Finish** | Tests pass → user picks merge/PR/keep/discard |

## Hard Rules

1. **No code without design.** Brainstorm before any implementation. "Too simple" is not an exemption.
2. **No production code without a failing test.** Write the test first. If you wrote code first, delete it and start with TDD.
3. **No skipping reviews.** Spec compliance check before code quality check. Both required.
4. **Surgical changes only.** Every changed line traces to the user's request. No drive-by improvements.
5. **YAGNI.** No speculative features. No premature abstractions. Build what's needed now.

## File Conventions

- Design specs → `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Implementation plans → `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`

## Explore → Plan → Code

When approaching any task:
1. **Explore** — Read the relevant files, understand the current state. Use subagents for investigation if needed.
2. **Plan** — Create an explicit plan with verification steps before writing code.
3. **Implement** — Write failing tests, then make them pass. Commit at logical checkpoints.
4. **Verify** — Run the test suite, check against the design spec, confirm the change is complete.
