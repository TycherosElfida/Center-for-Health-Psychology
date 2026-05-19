/**
 * CHP Platform — Clinical Report PDF Template
 *
 * Renders a branded clinical PDF report using @react-pdf/renderer.
 * Sections: letterhead, test info, score summary, interpretation,
 * item responses, crisis hotlines, disclaimer, and footer.
 *
 * Server-side only — imported lazily in the approve procedure.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReportData } from "./assemble";

/* ═══════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════ */

const colors = {
  primary: "#1B4965",
  accent: "#5FA8D3",
  success: "#2ecc71",
  warning: "#f59e0b",
  danger: "#e53e3e",
  text: "#1a1a2e",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#ffffff",
  lightBg: "#f8fafc",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: colors.text,
    backgroundColor: colors.bg,
  },

  // Letterhead
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  orgName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  orgSubtitle: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 2,
  },
  dateText: {
    fontSize: 8,
    color: colors.muted,
    textAlign: "right" as const,
  },

  // Section headers
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 8,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Score summary
  scoreBox: {
    flexDirection: "row",
    backgroundColor: colors.lightBg,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  scoreColumn: {
    flex: 1,
  },
  severityBadge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start" as const,
    marginTop: 4,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.lightBg,
  },
  tableCell: {
    fontSize: 9,
    color: colors.text,
  },

  // Dimension scores
  dimensionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },

  // Interpretation
  interpBox: {
    backgroundColor: colors.lightBg,
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  interpLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 4,
  },
  interpDesc: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  interpRec: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.4,
    fontStyle: "italic",
  },

  // Hotlines
  hotlineRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  hotlineName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    width: 100,
  },
  hotlineNumber: {
    fontSize: 9,
    color: colors.accent,
    width: 100,
  },
  hotlineDesc: {
    fontSize: 8,
    color: colors.muted,
    flex: 1,
  },

  // Disclaimer & footer
  disclaimer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  disclaimerText: {
    fontSize: 8,
    color: "#92400e",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute" as const,
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: colors.muted,
  },
});

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "low":
      return colors.success;
    case "moderate":
      return colors.warning;
    case "high":
    case "critical":
      return colors.danger;
    default:
      return colors.muted;
  }
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ClinicalReportPDF({ data }: { data: ReportData }) {
  const generatedDate = formatDate(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── 1. Letterhead ── */}
        <View style={styles.letterhead}>
          <View>
            <Text style={styles.orgName}>Center for Health Psychology</Text>
            <Text style={styles.orgSubtitle}>
              Universitas Kristen Krida Wacana (UKRIDA) — Fakultas Psikologi
            </Text>
          </View>
          <View>
            <Text style={styles.dateText}>Laporan dibuat: {generatedDate}</Text>
            <Text style={styles.dateText}>Ref: CHP-{data.testSlug.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── 2. Test Info ── */}
        <Text style={styles.sectionTitle}>Informasi Assessment</Text>
        <View style={styles.scoreBox}>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Instrumen</Text>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>{data.testName}</Text>
          </View>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Kategori</Text>
            <Text style={{ fontSize: 10 }}>{data.testCategory}</Text>
          </View>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Tanggal</Text>
            <Text style={{ fontSize: 10 }}>{formatDate(data.dateTaken)}</Text>
          </View>
        </View>

        {/* ── 3. Score Summary ── */}
        <Text style={styles.sectionTitle}>Ringkasan Skor</Text>
        <View style={styles.scoreBox}>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Total Skor</Text>
            <Text style={styles.scoreValue}>
              {data.totalScore}/{data.maxPossibleScore}
            </Text>
          </View>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>Tingkat</Text>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>
              {data.resultLabel ?? "-"}
            </Text>
            {data.interpretation && (
              <Text
                style={[
                  styles.severityBadge,
                  {
                    color: getSeverityColor(data.interpretation.severity),
                    backgroundColor: `${getSeverityColor(data.interpretation.severity)}20`,
                  },
                ]}
              >
                {data.interpretation.severity.toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* ── 4. Interpretation ── */}
        {data.interpretation && (
          <>
            <Text style={styles.sectionTitle}>Interpretasi</Text>
            <View style={styles.interpBox}>
              <Text style={styles.interpLabel}>{data.interpretation.label}</Text>
              <Text style={styles.interpDesc}>{data.interpretation.description}</Text>
              {data.interpretation.recommendation && (
                <>
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: "Helvetica-Bold",
                      color: colors.muted,
                      marginBottom: 2,
                    }}
                  >
                    Rekomendasi:
                  </Text>
                  <Text style={styles.interpRec}>{data.interpretation.recommendation}</Text>
                </>
              )}
            </View>
          </>
        )}

        {/* ── 5. Dimension Scores (if applicable) ── */}
        {data.dimensionScores.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skor per Dimensi</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: 120 }]}>Dimensi</Text>
              <Text style={[styles.tableHeaderText, { width: 60 }]}>Skor</Text>
              <Text style={[styles.tableHeaderText, { width: 60 }]}>Maks</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Label</Text>
            </View>
            {data.dimensionScores.map((ds, i) => (
              <View
                key={ds.dimension}
                style={[styles.dimensionRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, { width: 120, fontFamily: "Helvetica-Bold" }]}>
                  {ds.dimension}
                </Text>
                <Text style={[styles.tableCell, { width: 60 }]}>{ds.score}</Text>
                <Text style={[styles.tableCell, { width: 60 }]}>{ds.maxScore}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{ds.label ?? "-"}</Text>
              </View>
            ))}
          </>
        )}

        {/* ── 6. Item Responses ── */}
        <Text style={styles.sectionTitle}>Respons per Item</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: 30 }]}>No</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Pertanyaan</Text>
          <Text style={[styles.tableHeaderText, { width: 40, textAlign: "center" }]}>Skor</Text>
          <Text style={[styles.tableHeaderText, { width: 40, textAlign: "center" }]}>Rev</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={item.order} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { width: 30 }]}>{item.order}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.questionText}</Text>
            <Text style={[styles.tableCell, { width: 40, textAlign: "center" }]}>
              {item.rawAnswer}
            </Text>
            <Text style={[styles.tableCell, { width: 40, textAlign: "center" }]}>
              {item.isReversed ? "✓" : "-"}
            </Text>
          </View>
        ))}

        {/* ── 7. Citations ── */}
        {data.citations && data.citations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Referensi Medis & Sitasi</Text>
            {data.citations.map((cite, i) => (
              <View key={cite.id} style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 9, color: colors.text, lineHeight: 1.4 }}>
                  [{i + 1}] {cite.citation}
                </Text>
                {(cite.doi || cite.url) && (
                  <Text style={{ fontSize: 8, color: colors.accent, marginTop: 1 }}>
                    {cite.doi && `DOI: ${cite.doi}  `}
                    {cite.url && `URL: ${cite.url}`}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* ── 8. Crisis Hotlines ── */}
        <Text style={styles.sectionTitle}>Layanan Krisis</Text>
        {data.crisisHotlines.map((h) => (
          <View key={h.name} style={styles.hotlineRow}>
            <Text style={styles.hotlineName}>{h.name}</Text>
            <Text style={styles.hotlineNumber}>{h.number}</Text>
            <Text style={styles.hotlineDesc}>{h.description}</Text>
          </View>
        ))}

        {/* ── 9. Disclaimer ── */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            PENTING: Hasil assessment ini merupakan alat skrining awal dan BUKAN diagnosis klinis.
            Untuk evaluasi lebih lanjut, silakan konsultasikan dengan psikolog atau psikiater
            berlisensi. Jika Anda atau seseorang yang Anda kenal sedang dalam keadaan darurat,
            segera hubungi layanan krisis di atas.
          </Text>
        </View>

        {/* ── 10. Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            CHP Platform v1 — Center for Health Psychology, UKRIDA
          </Text>
          <Text style={styles.footerText}>RAHASIA — Hanya untuk penerima yang dituju</Text>
        </View>
      </Page>
    </Document>
  );
}
