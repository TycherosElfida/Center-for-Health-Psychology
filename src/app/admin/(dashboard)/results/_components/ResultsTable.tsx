"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, Eye, ChevronUp, ChevronDown, MoreVertical, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
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
            fontFamily: "'DM Sans', sans-serif",
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
              rows.map((row, i) => (
                <ResultsTableRow
                  key={row.id}
                  row={row}
                  index={i}
                  color={color}
                  maxScore={maxScore}
                  catColors={catColors}
                  sexColors={SEX_COLORS}
                  formatDate={formatDate}
                  scorePercent={scorePercent}
                />
              ))
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

function ResultsTableRow({
  row,
  index,
  color,
  maxScore,
  catColors,
  sexColors,
  formatDate,
  scorePercent,
}: {
  row: ResultRow;
  index: number;
  color: string;
  maxScore: number;
  catColors: Record<string, { bg: string; text: string }>;
  sexColors: Record<string, { bg: string; text: string }>;
  formatDate: (iso: string) => string;
  scorePercent: (score: number) => number;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const deleteMutation = trpc.adminResults.deleteResult.useMutation({
    onSuccess: () => {
      router.refresh();
      setIsDeleting(false);
      setMenuOpen(false);
    },
    onError: (err) => {
      alert(`Failed to delete result: ${err.message}`);
      setIsDeleting(false);
      setMenuOpen(false);
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const catStyle = catColors[row.resultLabel || ""] || { bg: DT.BG_CONTENT, text: DT.DARK_TEXT };
  const sexStyle = sexColors[row.sex || ""] || { bg: DT.BG_CONTENT, text: DT.DARK_TEXT };

  return (
    <tr
      style={{
        borderBottom: `1px solid ${DT.BORDER}`,
        background: index % 2 === 0 ? DT.WHITE : DT.BG_CONTENT,
        opacity: isDeleting ? 0.5 : 1,
        pointerEvents: isDeleting ? "none" : "auto",
        transition: "opacity 0.2s ease",
      }}
    >
      <td style={{ padding: "12px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DT.DARK_TEXT }}>
          {row.name || "Unknown"}
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            background: sexStyle.bg,
            color: sexStyle.text,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {row.sex}
        </span>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ fontSize: 12, color: DT.DARK_TEXT, fontWeight: 500 }}>
          {row.city || row.province}
        </div>
        {row.city && row.province && (
          <div style={{ fontSize: 10, color: DT.LIGHT_TEXT, marginTop: 2 }}>{row.province}</div>
        )}
      </td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: DT.DARK_TEXT, fontWeight: 600 }}>
        {row.age}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: color }}>
            {row.totalScore}/{maxScore}
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: `${color}20`,
              overflow: "hidden",
              width: "100%",
            }}
          >
            <div
              style={{
                width: `${scorePercent(row.totalScore)}%`,
                height: "100%",
                borderRadius: 2,
                background: color,
              }}
            />
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: catStyle.bg,
            color: catStyle.text,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {row.resultLabel || "Uncategorized"}
        </span>
      </td>
      <td style={{ padding: "12px 16px", fontSize: 12, color: DT.DARK_TEXT }}>
        {formatDate(row.createdAt)}
      </td>
      <td style={{ padding: "12px 16px", position: "relative" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => router.push(`/admin/results/${row.id}`)}
            title="View Details"
            style={{
              padding: 6,
              borderRadius: 6,
              background: DT.WHITE,
              border: `1px solid ${DT.BORDER}`,
              color: DT.TEAL,
              cursor: "pointer",
            }}
          >
            <Eye size={14} />
          </button>

          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              title="More actions"
              style={{
                padding: 6,
                borderRadius: 6,
                background: menuOpen ? DT.BG_CONTENT : "transparent",
                border: "none",
                color: DT.LIGHT_TEXT,
                cursor: "pointer",
              }}
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 4,
                  background: DT.WHITE,
                  border: `1px solid ${DT.BORDER}`,
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 50,
                  minWidth: 120,
                  padding: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <button
                  onClick={() => {
                    const ok = window.confirm(
                      "Are you sure you want to delete this result? This action cannot be undone."
                    );
                    if (ok) {
                      setIsDeleting(true);
                      deleteMutation.mutate({ scoreId: row.id });
                    } else {
                      setMenuOpen(false);
                    }
                  }}
                  disabled={isDeleting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "transparent",
                    border: "none",
                    color: DT.RED,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Trash2 size={12} /> {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
