<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:superpowers-workflow -->
# Superpowers Agentic Workflow (Mandatory)

**All** constructive work (features, bug fixes, refactors, architecture changes) in this workspace
MUST follow the 7-phase Superpowers workflow defined in `docs/superpowers/WORKFLOW.md`.

## Quick Reference — Phase Gates

| # | Phase | Skill | Gate |
|---|---|---|---|
| 1 | **Brainstorm** | `brainstorming` | Design presented + user approved + spec committed |
| 2 | **Isolate** | `using-git-worktrees` | Worktree created, baseline tests passing |
| 3 | **Plan** | `writing-plans` | Bite-sized plan approved, execution mode chosen |
| 4 | **Execute** | `subagent-driven-development` or `executing-plans` | Per-task TDD + two-stage review |
| 5 | **TDD** | `test-driven-development` | RED → GREEN → REFACTOR per task |
| 6 | **Review** | `requesting-code-review` | Spec compliance ✅ then code quality ✅ |
| 7 | **Finish** | `finishing-a-development-branch` | Tests pass → user picks merge/PR/keep/discard |

## Hard Rules (Zero Exceptions)

1. **No code without design.** Invoke `brainstorming` before any implementation. "Too simple" is not an exemption.
2. **No production code without a failing test.** If you wrote code first, delete it. Start over with TDD.
3. **No skipping reviews.** Spec compliance before code quality. Both required.
4. **Surgical changes only.** Every changed line traces to the user's request. No drive-by improvements.
5. **YAGNI.** No speculative features. No premature abstractions. Build what's needed now.

## Behavioral Overlays (Always Active)

- **Kaizen** — Continuous improvement, Poka-Yoke, Standardized Work, JIT. See skill: `kaizen`.
- **Karpathy Guidelines** — Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven. See skill: `karpathy-guidelines`.

## File Conventions

- Design specs → `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Implementation plans → `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- Full workflow reference → `docs/superpowers/WORKFLOW.md`

## Skill Invocation Rule

Before responding to ANY constructive request, check if a Superpowers skill applies.
If one does, invoke it. No rationalization. No "I'll do it informally."
Read `using-superpowers` skill for the full mandate.
<!-- END:superpowers-workflow -->
