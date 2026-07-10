# FREEZE RECORD — CHP Platform Instrument Configuration

> Declares the frozen unit per [`docs/UNDERSTANDING_LOCK.md`](docs/UNDERSTANDING_LOCK.md) §3:
> **frozen unit = { git commit hash of deployed scoring code } + { DB instrument-config snapshot date }**,
> where instrument config = all `questions`, `options`, and `result_interpretations` rows for the four
> slugs, plus `scoringVersion = 1`.

**Status:** 🔒 **FROZEN — 2026-07-06** — verified post-remediation against deployed commit `fbcbac35d2d28c4f5337cbf359ece93bb5cc2904` (`fbcbac3`). The DB snapshot below was re-verified against live production on 2026-07-06 and matches 100%. Per UNDERSTANDING_LOCK §3, the freeze is now officially declared.

---

## 1. DB instrument-config snapshot (tamper-check baseline)

**Snapshot date:** 2026-07-03
**Source:** live Neon database (Neon project `spring-union-99514659`), read-only `count(*)` queries run against production this date.

| Slug | Questions | Options | Result interpretations | Dimension NULLs | Status | scoringVersion |
|---|---|---|---|---|---|---|
| `pss10`  | 10 | 50 | 9  | 0 | published | 1 |
| `gpius2` | 15 | 75 | 21 | 0 | published | 1 |
| `srs`    | 11 | 66 | 12 | 0 | published | 1 |
| `srq29`  | 29 | 58 | 8  | 0 | published | 1 |
| **Total** | **65** | **249** | **50** | **0** | — | — |

**Raw SQL Verification Query & Output (2026-07-06):**
```sql
SELECT t.slug,
       (SELECT count(*) FROM questions q WHERE q.test_id = t.id)::int AS questions,
       (SELECT count(*) FROM options o JOIN questions q ON o.question_id = q.id WHERE q.test_id = t.id)::int AS options,
       (SELECT count(*) FROM result_interpretations ri WHERE ri.test_id = t.id)::int AS result_interpretations,
       (SELECT count(*) FROM questions q WHERE q.test_id = t.id AND q.dimension IS NULL)::int AS dimension_nulls,
       t.status,
       t.version AS scoring_version
FROM tests t
WHERE t.slug IN ('pss10', 'gpius2', 'srs', 'srq29')
ORDER BY t.slug;
```
```json
[
  { "slug": "gpius2", "questions": 15, "options": 75, "result_interpretations": 21, "dimension_nulls": 0, "status": "published", "scoring_version": 1 },
  { "slug": "pss10",  "questions": 10, "options": 50, "result_interpretations": 9,  "dimension_nulls": 0, "status": "published", "scoring_version": 1 },
  { "slug": "srq29",  "questions": 29, "options": 58, "result_interpretations": 8,  "dimension_nulls": 0, "status": "published", "scoring_version": 1 },
  { "slug": "srs",    "questions": 11, "options": 66, "result_interpretations": 12, "dimension_nulls": 0, "status": "published", "scoring_version": 1 }
]
```

Any future `count(*)` that diverges from this table means the frozen instrument config was mutated —
investigate before trusting any results scored after the divergence.

## 2. Dimension-structure verification

All 65 questions have a non-NULL `dimension`. Per-instrument structure (confirms the scoring engine
produces the intended subscales):

- **pss10** — Helplessness ×6, Self-Efficacy ×4
- **gpius2** — POSI ×3, MR ×3, CP ×3, CU ×3, NO ×3 (DSR = CP + CU is a computed second-order rollup, not stored)
- **srs** — Efficacy ×3, Satisfaction ×3, Control ×5
- **srq29** — neurotic ×20, psychotic ×3, ptsd ×5, substance ×1

This matches the ground truth recorded in UNDERSTANDING_LOCK §1 (which reported "0 NULL across all 65
questions" from the 10 June scan). **No regression** between 10 June and this 3 July snapshot.

## 3. Frozen code baseline

- **Branch prepared for deploy:** `remediation/fix-before-sidang` (merged to `master`)
- **Deployed commit hash:** `fbcbac35d2d28c4f5337cbf359ece93bb5cc2904` (`fbcbac3`)
- **Deploy date:** `2026-07-06`
- **Pre-remediation baseline commit (audited):** `085ae12`

The remediation branch modifies `src/server/trpc/procedures/sessions.ts` (S-2 demographics freeze
guard; S-9 fail-loud identifier hashing). Neither change alters scoring logic in
`src/server/scoring/`, but because `sessions.ts` is a freeze-protocol-protected file
(UNDERSTANDING_LOCK §4.3), the freeze **must be declared against the post-remediation deployed commit**,
not the 085ae12 audit baseline. That is why this record is finalized at deploy, not before.

## 4. Data state at freeze preparation (informational, not part of the frozen unit)

Snapshot 2026-07-03: 80 sessions · 69 completed · 69 results · 1077 answers · **0 orphans** (completed = results).
*(Note: Following the 6 July 2026 synthetic test data cleanup, the informational data state stands at 63 sessions · 58 completed · 58 results · 883 answers).*

These pre-freeze rows are **not** the study sample (UNDERSTANDING_LOCK D3). The study sample is
post-freeze respondents only; `in_progress` sessions are excluded.

> [!IMPORTANT]
> **JTIIK / Study Sampling Guidance:** Because there is a 3-day gap between the initial data snapshot (3 July) and the actual freeze deploy date (6 July), any data extraction or JTIIK sampling script MUST filter by a precise post-deploy timestamp (e.g., `test_sessions.started_at >= '2026-07-06T00:00:00Z'` or the exact deploy timestamp of commit `fbcbac3`) or explicitly exclude pre-deploy session IDs. Relying merely on a date cutoff of `2026-07-03` will improperly include pre-freeze sessions collected during the intervening window.

## 5. Operational freeze protocol (active during the study window)

Per UNDERSTANDING_LOCK §4, once this record is finalized:

1. No `pnpm db:seed` against production (FH-3 makes accidental runs safe; the rule still stands).
2. No admin edits to the four instruments (bands hard-locked; structure locked; `dimension` locked by FH-2).
3. No deploys touching `src/server/scoring/` or `sessions.ts`; if unavoidable, re-declare the freeze
   (re-run §1, bump the deployed-commit-hash) and document in the paper.
4. Weekly integrity query during collection: answers count vs expected per completed session; flag any
   `answers.answered_at > test_sessions.completed_at` (should be impossible after FH-1, and now also
   for demographics after S-2).
5. Study sample = post-freeze respondents only (filtered strictly by deploy timestamp as noted in §4).

## 6. How to finalize this record (deploy checklist)

1. Merge `remediation/fix-before-sidang` → `master`.
2. Deploy.
3. `git rev-parse HEAD` on the deployed commit → paste into §3 "Deployed commit hash".
4. Fill §3 "Deploy date".
5. Re-run the §1 `count(*)` queries against production and confirm they still match this table
   (they should — deploying code does not touch instrument-config rows). If they match, change the
   Status line at the top from "PENDING DEPLOY" to "FROZEN — <date>".
