# Clinical Audit Documents

Source-of-truth audit trail for each psychometric instrument on the CHP Digital Assessment Platform. Each document records instrument provenance, scoring logic verification, interpretation thresholds, citation inventory, and known limitations.

## Instruments

| Instrument | File | Status |
|---|---|---|
| GPIUS-2 | [gpius2-clinical-audit.md](./gpius2-clinical-audit.md) | ✅ Complete |
| SRS | [srs-clinical-audit.md](./srs-clinical-audit.md) | ✅ Complete |

### External Audits (Artifact Storage)

PSS-10 and SRQ-29 audit documents are maintained in the conversation artifact system per user preference:

| Instrument | Location | Status |
|---|---|---|
| PSS-10 | Conversation artifact `pss10-clinical-audit.md` | ✅ Complete |
| SRQ-29 | Conversation artifact `srq29-clinical-audit.md` | ✅ Complete |

## Audit Scope

Each audit document covers:

1. **Instrument Overview** — Author, year, adaptation, item count, scale, reversed items
2. **Dimensional Structure** — Subscale composition, item assignments, derived dimensions
3. **Interpretation Thresholds** — Score ranges, labels, severity mapping, cutoff provenance
4. **Citation Inventory** — Full reference list with DOIs, type classification
5. **Implementation Verification** — Code-level checks against clinical specifications
6. **Known Limitations** — Gaps in validation, normative data, or clinical grounding

---

*Created as part of the Scoring Engine Clinical Remediation (Phase A, Stage 4).*
