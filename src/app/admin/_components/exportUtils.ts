import * as XLSX from "xlsx";

/**
 * Neutralize spreadsheet formula injection (S-10). A cell whose text begins
 * with =, +, -, @, or a tab/CR is executed as a formula when the exported
 * CSV/XLSX is opened in Excel or Google Sheets. Guest-controlled fields
 * (name, province, city) flow into cells unmodified, so a respondent named
 * `=HYPERLINK(...)` could run code on an admin's machine. Prefixing with an
 * apostrophe forces the value to be treated as literal text.
 */
function escapeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Sorted union of dimensionScores keys across all rows (FH-4). */
function collectDimensionKeys(rows: Array<Record<string, unknown>>): string[] {
  const keys = new Set<string>();
  for (const r of rows) {
    const dims = (r.dimensionScores ?? {}) as Record<string, number>;
    for (const k of Object.keys(dims)) keys.add(k);
  }
  return [...keys].sort();
}

/**
 * Pure row mapping for the results export — exported for unit tests.
 *
 * Column order: identity/demographics, per-question raw answers, total,
 * category, per-dimension scores ("DIM {key}", alphabetical — FH-4),
 * score version, date. Rows without a value for a dimension key get a
 * blank cell.
 */
export function buildExportRows(
  rows: Array<Record<string, unknown>>,
  questionHeaders: Array<{ order: number; label: string }>
): Array<Record<string, unknown>> {
  const dimensionKeys = collectDimensionKeys(rows);

  return rows.map((r) => {
    const itemAnswers = (r.itemAnswers ?? {}) as Record<number, number | string>;
    const row: Record<string, unknown> = {
      "Result ID": r.id ?? "",
      "Session ID": r.sessionId ?? "",
      Name: r.name ?? "",
      Sex: r.sex ?? "",
      "Province/City": `${r.province ?? ""} ${r.city ?? ""}`.trim(),
      Age: r.age ?? "",
    };

    // Per-question columns ordered by question index
    for (const qh of questionHeaders) {
      row[qh.label] = itemAnswers[qh.order] ?? "";
    }

    row["Total (Computed)"] = r.totalScore ?? 0;
    row["Category"] = r.resultLabel ?? "";

    // Per-dimension score columns (FH-4)
    const dims = (r.dimensionScores ?? {}) as Record<string, number>;
    for (const key of dimensionKeys) {
      row[`DIM ${key}`] = dims[key] ?? "";
    }

    row["Score Version"] = r.scoringVersion ?? "";
    row["Date"] = r.createdAt ? new Date(r.createdAt as string).toLocaleDateString("en-GB") : "";

    // S-10: defuse formula injection in every string cell before it reaches
    // a spreadsheet. Numeric cells (scores, answers) are left as-is.
    for (const key of Object.keys(row)) {
      const v = row[key];
      if (typeof v === "string") row[key] = escapeFormula(v);
    }

    return row;
  });
}

/**
 * Generates a CSV or XLSX from result rows and triggers a browser download.
 */
export function downloadData(
  rows: Array<Record<string, unknown>>,
  questionHeaders: Array<{ order: number; label: string }>,
  filename: string,
  format: "csv" | "xlsx"
) {
  if (rows.length === 0) return;

  const exportData = buildExportRows(rows, questionHeaders);

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

  if (format === "csv") {
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(["\uFEFF" + csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}
