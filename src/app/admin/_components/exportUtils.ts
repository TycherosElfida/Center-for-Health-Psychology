import * as XLSX from "xlsx";

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

  const exportData = rows.map((r) => {
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
    row["Score Version"] = r.scoringVersion ?? "";
    row["Date"] = r.createdAt ? new Date(r.createdAt as string).toLocaleDateString("en-GB") : "";

    return row;
  });

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
