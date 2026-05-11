"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import {
  ClipboardList,
  Users,
  Award,
  Search,
  RotateCcw,
  Eye,
  ChevronUp,
  ChevronDown,
  Calendar,
  Settings,
} from "lucide-react";
import {
  BRAND,
  BRAND_DEEP,
  BRAND_LIGHT,
  WHITE,
  DARK_TEXT,
  MID_TEXT,
  LIGHT_TEXT,
  BORDER,
} from "../../_components/DesignTokens";

/* ── Constants ─────────────────────────────────────────────── */

const TEST_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  srq29: { bg: "#F3E5F5", text: "#7B1FA2" },
  pss10: { bg: "#FCE4EC", text: "#AD1457" },
  gpius2: { bg: "#EDE7F6", text: "#4527A0" },
  srs: { bg: "#E0F2F1", text: "#00695C" },
};
const DEFAULT_TEST_COLOR = { bg: BRAND_LIGHT, text: BRAND_DEEP };

const SLUG_LABELS: Record<string, string> = {
  srq29: "SRQ-29",
  pss10: "PSS-10",
  gpius2: "GPIUS-2",
  srs: "SRS",
};

const MAX_SCORE: Record<string, number> = {
  srq29: 29,
  pss10: 40,
  gpius2: 75,
  srs: 66,
};

function getCategoryColor(label: string | null): { bg: string; text: string } {
  if (!label) return { bg: "#F5F3FA", text: LIGHT_TEXT };
  const l = label.toLowerCase();
  if (
    l.includes("severe") ||
    l.includes("high stress") ||
    l.includes("compulsive") ||
    l.includes("low resilience")
  )
    return { bg: "#FFEBEE", text: "#C62828" };
  if (l.includes("moderate") || l.includes("deficient")) return { bg: "#FFF3E0", text: "#E65100" };
  if (l.includes("mild") || l.includes("mood")) return { bg: "#FFF8E1", text: "#F57F17" };
  return { bg: "#E8F5E9", text: "#2E7D32" };
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ── Sort types ────────────────────────────────────────────── */

type SortCol = "name" | "testSlug" | "totalScore" | "resultLabel" | "createdAt";
type SortDir = "asc" | "desc";

/* ── Component ─────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const router = useRouter();
  const statsQuery = trpc.adminDashboard.stats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const isLoading = statsQuery.isLoading;
  const data = statsQuery.data;

  // Filters
  const [filterSlug, setFilterSlug] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sort
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const hasFilter = filterSlug !== "" || dateFrom !== "" || dateTo !== "";

  const recentResults = useMemo(() => data?.recentResults ?? [], [data?.recentResults]);

  const filteredResults = useMemo(() => {
    let rows = [...recentResults];
    if (filterSlug) rows = rows.filter((r) => r.testSlug === filterSlug);
    if (dateFrom) {
      const from = new Date(dateFrom);
      rows = rows.filter((r) => new Date(r.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => new Date(r.createdAt) <= to);
    }
    return rows;
  }, [recentResults, filterSlug, dateFrom, dateTo]);

  const sortedResults = useMemo(() => {
    if (!sortCol) return filteredResults;
    const arr = [...filteredResults];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "name":
          cmp = (a.respondentName ?? "").localeCompare(b.respondentName ?? "");
          break;
        case "testSlug":
          cmp = a.testSlug.localeCompare(b.testSlug);
          break;
        case "totalScore":
          cmp = Number(a.totalScore ?? 0) - Number(b.totalScore ?? 0);
          break;
        case "resultLabel":
          cmp = (a.resultLabel ?? "").localeCompare(b.resultLabel ?? "");
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filteredResults, sortCol, sortDir]);

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortCol(null);
        setSortDir("asc");
      }
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setFilterSlug("");
    setDateFrom("");
    setDateTo("");
  }

  const distinctSlugs = useMemo(() => {
    return [...new Set(recentResults.map((r) => r.testSlug))];
  }, [recentResults]);

  const totalRows = recentResults.length;

  /* ── Stat card config ── */
  const statCards = [
    {
      title: "Total Tests Taken",
      value: (data?.totalCompleted ?? 0).toLocaleString(),
      badge: "+12.4%",
      Icon: ClipboardList,
      iconBg: BRAND_LIGHT,
      iconColor: BRAND,
    },
    {
      title: "Active Users",
      value: String(data?.activeSessions ?? 0),
      badge: "+8.1%",
      Icon: Users,
      iconBg: "rgba(179,168,212,0.12)",
      iconColor: "#B3A8D4",
    },
    {
      title: "Most Popular Test",
      value: data?.popularTest?.title ?? "—",
      badge: "48% share",
      Icon: Award,
      iconBg: "#EBF0FA",
      iconColor: "#8BA3D4",
    },
  ];

  /* ── Column defs ── */
  const columns: {
    key: string;
    label: string;
    sortKey?: SortCol;
    width: string;
  }[] = [
    { key: "respondent", label: "Respondent", sortKey: "name", width: "18%" },
    {
      key: "testType",
      label: "Test Type",
      sortKey: "testSlug",
      width: "11%",
    },
    { key: "location", label: "Province/City", width: "15%" },
    {
      key: "score",
      label: "Score",
      sortKey: "totalScore",
      width: "14%",
    },
    {
      key: "category",
      label: "Result Category",
      sortKey: "resultLabel",
      width: "15%",
    },
    {
      key: "date",
      label: "Test Date",
      sortKey: "createdAt",
      width: "11%",
    },
    { key: "actions", label: "Actions", width: "9%" },
  ];

  return (
    <div className="admin-fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-shimmer" style={{ height: 96, borderRadius: 16 }} />
            ))
          : statCards.map((card) => (
              <div
                key={card.title}
                className="admin-stat-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "20px 24px",
                  background: WHITE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: card.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <card.Icon size={20} color={card.iconColor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: DARK_TEXT,
                      fontFamily: "'DM Sans', 'Inter', sans-serif",
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {card.value}
                  </div>
                  <div style={{ fontSize: 12, color: LIGHT_TEXT, marginTop: 2 }}>{card.title}</div>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 20,
                    background: "#E8F5E9",
                    color: "#2E7D32",
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {card.badge}
                </span>
              </div>
            ))}
      </div>

      {/* ── Table Card ── */}
      <div
        style={{
          background: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: DARK_TEXT,
                fontFamily: "'DM Sans', 'Inter', sans-serif",
              }}
            >
              All Assessment Results
            </h2>
            {hasFilter && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: BRAND_LIGHT,
                  color: BRAND_DEEP,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Filtered
              </span>
            )}
          </div>
          <Link href="/admin/assessments" className="admin-btn-primary">
            <Settings size={14} /> Manage Scales &amp; Questions
          </Link>
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderBottom: `1px solid ${BORDER}`,
            background: "#FAFAFE",
            flexWrap: "wrap",
          }}
        >
          <select
            value={filterSlug}
            onChange={(e) => setFilterSlug(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              background: WHITE,
              fontSize: 12,
              color: DARK_TEXT,
              cursor: "pointer",
              minWidth: 120,
            }}
          >
            <option value="">All Tests</option>
            {distinctSlugs.map((s) => (
              <option key={s} value={s}>
                {SLUG_LABELS[s] ?? s}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={13} color={LIGHT_TEXT} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                background: WHITE,
                fontSize: 12,
                color: DARK_TEXT,
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={13} color={LIGHT_TEXT} />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                background: WHITE,
                fontSize: 12,
                color: DARK_TEXT,
              }}
            />
          </div>

          {hasFilter && (
            <button onClick={clearFilters} className="admin-btn-ghost">
              <RotateCcw size={11} /> Reset
            </button>
          )}

          <span style={{ marginLeft: "auto", fontSize: 12, color: LIGHT_TEXT }}>
            {sortedResults.length} of {totalRows} records
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="admin-shimmer"
                style={{ height: 44, marginBottom: 8, borderRadius: 8 }}
              />
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: 560, overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                {columns.map((c) => (
                  <col key={c.key} style={{ width: c.width }} />
                ))}
              </colgroup>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr style={{ background: "#F5F3FA" }}>
                  {columns.map((h) => (
                    <th
                      key={h.key}
                      onClick={h.sortKey ? () => handleSort(h.sortKey!) : undefined}
                      style={{
                        padding: "12px 14px",
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: sortCol === h.sortKey ? BRAND_DEEP : MID_TEXT,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        borderBottom: `1px solid ${BORDER}`,
                        cursor: h.sortKey ? "pointer" : "default",
                        userSelect: "none",
                        fontFamily: "'Inter', sans-serif",
                        background: "#F5F3FA",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {h.label}
                        {h.sortKey &&
                          (sortCol === h.sortKey ? (
                            sortDir === "asc" ? (
                              <ChevronUp size={10} color={BRAND_DEEP} />
                            ) : (
                              <ChevronDown size={10} color={BRAND_DEEP} />
                            )
                          ) : (
                            <ChevronUp size={10} style={{ opacity: 0.3 }} />
                          ))}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{ padding: "40px 16px", textAlign: "center" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Search size={28} color={BORDER} />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: MID_TEXT,
                          }}
                        >
                          No results found
                        </span>
                        <span style={{ fontSize: 12, color: LIGHT_TEXT }}>
                          Try adjusting your filters
                        </span>
                        {hasFilter && (
                          <button
                            onClick={clearFilters}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 12px",
                              borderRadius: 8,
                              marginTop: 4,
                              background: BRAND_LIGHT,
                              border: `1px solid ${BRAND}30`,
                              color: BRAND_DEEP,
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
                  sortedResults.map((row, i) => {
                    const tc = TEST_TYPE_COLORS[row.testSlug] ?? DEFAULT_TEST_COLOR;
                    const cc = getCategoryColor(row.resultLabel);
                    const ms = MAX_SCORE[row.testSlug] ?? 100;
                    const score = Number(row.totalScore ?? 0);
                    const pct = Math.min(100, Math.round((score / ms) * 100));
                    const loc =
                      row.province || row.city
                        ? `${row.province ?? ""}${row.province && row.city ? " / " : ""}${row.city ?? ""}`
                        : "—";

                    return (
                      <tr
                        key={row.scoreId}
                        className="admin-row-hover"
                        style={{
                          background: i % 2 === 0 ? WHITE : "#FBFAFD",
                          borderBottom: `1px solid ${BORDER}`,
                        }}
                      >
                        {/* Respondent */}
                        <td style={{ padding: "12px 14px" }}>
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
                                background: tc.bg,
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
                                  color: tc.text,
                                }}
                              >
                                {getInitials(row.respondentName)}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: DARK_TEXT,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.respondentName ?? "Anonymous"}
                            </span>
                          </div>
                        </td>

                        {/* Test Type */}
                        <td
                          style={{
                            padding: "12px 14px",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: 20,
                              background: tc.bg,
                              color: tc.text,
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {SLUG_LABELS[row.testSlug] ?? row.testSlug}
                          </span>
                        </td>

                        {/* Province/City */}
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: 12,
                            color: MID_TEXT,
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {loc}
                        </td>

                        {/* Score */}
                        <td
                          style={{
                            padding: "12px 14px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                height: 5,
                                width: 52,
                                borderRadius: 999,
                                background: `${tc.text}18`,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  background: tc.text,
                                  borderRadius: 999,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: tc.text,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {score} / {ms}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td
                          style={{
                            padding: "12px 14px",
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
                            padding: "12px 14px",
                            fontSize: 12,
                            color: MID_TEXT,
                            textAlign: "center",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatDate(row.createdAt)}
                        </td>

                        {/* Actions */}
                        <td
                          style={{
                            padding: "12px 14px",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={() => router.push(`/admin/results/${row.scoreId}`)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "5px 12px",
                              borderRadius: 8,
                              background: `${tc.text}12`,
                              border: `1px solid ${tc.text}30`,
                              color: tc.text,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${tc.text}20`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = `${tc.text}12`;
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
        )}

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${BORDER}`,
            fontSize: 12,
            color: LIGHT_TEXT,
          }}
        >
          {sortedResults.length} of {totalRows} records
        </div>
      </div>
    </div>
  );
}
