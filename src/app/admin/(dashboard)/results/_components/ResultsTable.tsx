"use client";

import { useRouter } from "next/navigation";
import { Search, RotateCcw, Eye, ChevronUp, ChevronDown } from "lucide-react";
import {
  DT,
  CATEGORY_COLORS,
  SEX_COLORS,
  type ResultRow,
  type SortField,
  type SortDirection,
  type TestTabConfig,
} from "./types";

/* ── Sort icon ── */
function SortIcon({ active, direction }: { active: boolean; direction: SortDirection | null }) {
  if (!active || !direction) {
    return (
      <span style={{ opacity: 0.3, display: "inline-flex" }}>
        <ChevronUp size={10} />
      </span>
    );
  }
  return direction === "asc" ? (
    <ChevronUp size={10} color={DT.TEAL_DARK} />
  ) : (
    <ChevronDown size={10} color={DT.TEAL_DARK} />
  );
}

interface ResultsTableProps {
  rows: ResultRow[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  hasAnyFilter: boolean;
  onClearFilters: () => void;
  testConfig: TestTabConfig;
  exportActions?: React.ReactNode;
}

export function ResultsTable({
  rows,
  isLoading,
  total,
  page,
  pageSize,
  onPageChange,
  sortField,
  sortDirection,
  onSort,
  hasAnyFilter,
  onClearFilters,
  testConfig,
  exportActions,
}: ResultsTableProps) {
  const router = useRouter();
  const { color, slug, maxScore, shortName } = testConfig;
  const catColors = CATEGORY_COLORS[slug] ?? {};
  const totalPages = Math.ceil(total / pageSize);

  const columns: { key: SortField | "domicile" | "actions"; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "sex", label: "Sex" },
    { key: "domicile", label: "Province/City" },
    { key: "age", label: "Age" },
    { key: "score", label: "Score" },
    { key: "category", label: "Result Category" },
    { key: "testDate", label: "Test Date" },
    { key: "actions", label: "Actions" },
  ];

  const colWidths = ["15%", "7%", "16%", "5%", "13%", "17%", "10%", "12%"];

  function scorePercent(score: number) {
    return Math.min(100, Math.round((score / maxScore) * 100));
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (isLoading) {
    return (
      <div
        style={{
          background: DT.WHITE,
          border: `1px solid ${DT.BORDER}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="admin-skeleton"
              style={{ height: 48, marginBottom: 8, borderRadius: 8 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: DT.WHITE,
        border: `1px solid ${DT.BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Table title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${DT.BORDER}`,
        }}
      >
        <h3
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: DT.DARK_TEXT,
            margin: 0,
          }}
        >
          {shortName} Individual Results
        </h3>
        {exportActions && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{exportActions}</div>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          maxHeight: 600,
          overflowY: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ background: DT.BG_HEADER }}>
              {columns.map((h) => (
                <th
                  key={h.key}
                  onClick={
                    h.key !== "actions" && h.key !== "domicile"
                      ? () => onSort(h.key as SortField)
                      : undefined
                  }
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: sortField === h.key ? DT.TEAL_DARK : DT.MID_TEXT,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    borderBottom: `1px solid ${DT.BORDER}`,
                    whiteSpace: "nowrap",
                    cursor: h.key !== "actions" && h.key !== "domicile" ? "pointer" : "default",
                    userSelect: "none",
                    fontFamily: "'Inter', sans-serif",
                    verticalAlign: "middle",
                    background: DT.BG_HEADER,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    {h.label}
                    {h.key !== "actions" && h.key !== "domicile" && (
                      <SortIcon
                        active={sortField === h.key}
                        direction={sortField === h.key ? sortDirection : null}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Search size={28} color={DT.BORDER} />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: DT.MID_TEXT,
                      }}
                    >
                      No results found
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: DT.LIGHT_TEXT,
                      }}
                    >
                      Try adjusting your filters
                    </span>
                    {hasAnyFilter && (
                      <button
                        onClick={onClearFilters}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 8,
                          marginTop: 4,
                          background: DT.TEAL_LIGHT,
                          border: `1px solid ${DT.TEAL}30`,
                          color: DT.TEAL_DARK,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <RotateCcw size={11} /> Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const cc = catColors[row.resultLabel ?? ""] ?? {
                  bg: DT.TEAL_LIGHT,
                  text: DT.TEAL_DARK,
                };
                const sc = SEX_COLORS[row.sex ?? ""] ?? {
                  bg: DT.TEAL_LIGHT,
                  text: DT.TEAL_DARK,
                };

                return (
                  <tr
                    key={row.id}
                    style={{
                      background: i % 2 === 0 ? DT.WHITE : DT.BG_ALT,
                      borderBottom: `1px solid ${DT.BORDER}`,
                    }}
                  >
                    {/* Name */}
                    <td
                      style={{
                        padding: "12px 14px",
                        verticalAlign: "middle",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: `${color}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {row.name
                              ? row.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                              : "—"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: DT.DARK_TEXT,
                            lineHeight: 1.45,
                            wordBreak: "break-word",
                            minWidth: 0,
                          }}
                        >
                          {row.name ?? "—"}
                        </span>
                      </div>
                    </td>

                    {/* Sex */}
                    <td
                      style={{
                        padding: "12px 14px",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      {row.sex ? (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: sc.bg,
                            color: sc.text,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {row.sex}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#C4BEDA",
                            fontStyle: "italic",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Province/City */}
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: DT.MID_TEXT,
                        verticalAlign: "middle",
                        textAlign: "center",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      {row.province || row.city
                        ? `${row.province ?? ""}${
                            row.province && row.city ? " / " : ""
                          }${row.city ?? ""}`
                        : "—"}
                    </td>

                    {/* Age */}
                    <td
                      style={{
                        padding: "12px 18px",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      {row.age !== null ? (
                        <span
                          style={{
                            fontSize: 13,
                            color: DT.DARK_TEXT,
                            fontWeight: 500,
                          }}
                        >
                          {row.age}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#C4BEDA",
                            fontStyle: "italic",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Score with progress bar */}
                    <td
                      style={{
                        padding: "12px 18px",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          justifyContent: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            height: 5,
                            width: 52,
                            borderRadius: 999,
                            background: `${color}18`,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${scorePercent(row.totalScore)}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                              borderRadius: 999,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color,
                          }}
                        >
                          {row.totalScore} / {maxScore}
                        </span>
                      </div>
                    </td>

                    {/* Category badge */}
                    <td
                      style={{
                        padding: "12px 18px",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      {row.resultLabel ? (
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: cc.bg,
                            color: cc.text,
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.resultLabel}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#C4BEDA",
                            fontStyle: "italic",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td
                      style={{
                        padding: "12px 18px",
                        fontSize: 12,
                        color: DT.MID_TEXT,
                        fontVariantNumeric: "tabular-nums",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      {formatDate(row.createdAt)}
                    </td>

                    {/* Actions */}
                    <td
                      style={{
                        padding: "12px 18px",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => router.push(`/admin/results/${row.id}`)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 12px",
                          borderRadius: 8,
                          background: `${color}12`,
                          border: `1px solid ${color}30`,
                          color,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${color}20`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${color}12`;
                        }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderTop: `1px solid ${DT.BORDER}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: DT.LIGHT_TEXT }}>
            {hasAnyFilter ? (
              <>
                Showing <b style={{ color: DT.TEAL_DARK, fontWeight: 700 }}>{rows.length}</b> of{" "}
                {total} {shortName} results{" "}
                <span style={{ color: DT.TEAL_DARK, fontWeight: 500 }}>(filtered)</span>
              </>
            ) : (
              <>
                Page {page + 1} of {totalPages || 1} · {total} total results
              </>
            )}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: DT.LIGHT_TEXT,
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke={DT.SAGE}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 13h2" />
              <path d="M8 17h2" />
              <path d="M14 13h2" />
              <path d="M14 17h2" />
            </svg>
            Supports .xlsx & .csv export
          </span>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: `1px solid ${DT.BORDER}`,
                background: DT.WHITE,
                color: DT.MID_TEXT,
                fontSize: 13,
                cursor: page === 0 ? "not-allowed" : "pointer",
                opacity: page === 0 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: DT.MID_TEXT }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: `1px solid ${DT.BORDER}`,
                background: DT.WHITE,
                color: DT.MID_TEXT,
                fontSize: 13,
                cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                opacity: page >= totalPages - 1 ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
