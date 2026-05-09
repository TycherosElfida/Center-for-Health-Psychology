/**
 * Admin Assessments List Page
 *
 * Server-rendered shell for the assessment management view.
 * Delegates interactive functionality to _components/AssessmentsClient.
 *
 * UI Remake: restyled to match DesignReference/AssessmentManagementPage.tsx
 */
"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { Search, Plus, FileText, BarChart3, GitBranch, Users, AlertTriangle } from "lucide-react";
import { CreateTestSheet } from "./_components/CreateTestSheet";
import { StatusActions } from "./_components/StatusActions";
import {
  BRAND,
  BRAND_DEEP,
  BRAND_LIGHT,
  BRAND_BG,
  WHITE,
  DARK_TEXT,
  MID_TEXT,
  LIGHT_TEXT,
  BORDER,
  RED,
  WARNING,
  STATUS_CONFIG,
  SCORING_LABELS,
  inputStyle,
  onInputFocus,
  onInputBlur,
} from "../../_components/DesignTokens";

/* ── Scoring method icon mapping ─────────────────────────────── */
const SCORING_ICON_MAP: Record<string, typeof FileText> = {
  summative: BarChart3,
  dimensional: GitBranch,
  binary_cluster: FileText,
};

type StatusFilter = "all" | "draft" | "published" | "archived";

export default function AssessmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const testsQuery = trpc.adminTests.getTests.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(() => {
    if (!testsQuery.data) return [];
    let items = testsQuery.data;

    // Status filter
    if (statusFilter !== "all") {
      items = items.filter((t) => t.status === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          (t.category && t.category.toLowerCase().includes(q))
      );
    }

    return items;
  }, [testsQuery.data, statusFilter, search]);

  const statusCounts = useMemo(() => {
    if (!testsQuery.data) return { all: 0, draft: 0, published: 0, archived: 0 };
    return {
      all: testsQuery.data.length,
      draft: testsQuery.data.filter((t) => t.status === "draft").length,
      published: testsQuery.data.filter((t) => t.status === "published").length,
      archived: testsQuery.data.filter((t) => t.status === "archived").length,
    };
  }, [testsQuery.data]);

  return (
    <div className="admin-fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: DARK_TEXT,
              margin: 0,
              letterSpacing: "-0.015em",
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}
          >
            Assessment Instruments
          </h1>
          <p style={{ fontSize: 13, color: LIGHT_TEXT, margin: "4px 0 0" }}>
            Create, edit, and manage assessment lifecycle
          </p>
        </div>
        <button className="admin-btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          New Assessment
        </button>
      </div>

      {/* ── Status Filter Tabs (DesignReference pill-tab pattern) ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
          background: "#F0EDF6",
          borderRadius: 12,
          padding: 4,
        }}
      >
        {(["all", "draft", "published", "archived"] as const).map((tab) => {
          const isActive = statusFilter === tab;
          const count = statusCounts[tab];
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`admin-tab ${isActive ? "admin-tab--active" : ""}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? BRAND_DEEP : LIGHT_TEXT,
                textTransform: "capitalize",
              }}
            >
              {tab}
              <span
                style={{
                  background: isActive ? BRAND_LIGHT : "#E8E4F0",
                  color: isActive ? BRAND_DEEP : LIGHT_TEXT,
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ── */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: LIGHT_TEXT,
          }}
        />
        <input
          type="text"
          placeholder="Search by title, slug, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...inputStyle,
            paddingLeft: 40,
          }}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
      </div>

      {/* ── Data Table ── */}
      <div
        style={{
          background: WHITE,
          borderRadius: 14,
          border: `1px solid ${BORDER}`,
          overflow: "hidden",
        }}
      >
        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "26%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "16%" }} />
          </colgroup>
          <thead>
            <tr
              style={{
                background: "#F9F7FD",
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              {["Title", "Slug", "Scoring", "Status", "Sessions", "Items", "Actions"].map(
                (label, idx) => (
                  <th
                    key={label}
                    style={{
                      padding: "12px 16px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: LIGHT_TEXT,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: idx >= 4 ? "center" : "left",
                      ...(idx === 6 ? { textAlign: "right", paddingRight: 20 } : {}),
                    }}
                  >
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {/* Loading State */}
            {testsQuery.isLoading && (
              <tr>
                <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center" }}>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="admin-skeleton"
                      style={{ height: 48, marginBottom: 8, borderRadius: 8 }}
                    />
                  ))}
                </td>
              </tr>
            )}

            {/* Empty State */}
            {testsQuery.isSuccess && rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    color: LIGHT_TEXT,
                  }}
                >
                  <FileText
                    size={40}
                    style={{ margin: "0 auto 12px", opacity: 0.4, display: "block" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>
                    {search || statusFilter !== "all"
                      ? "No matching assessments"
                      : "No assessments yet"}
                  </p>
                  <p style={{ fontSize: 12, margin: 0 }}>
                    {search || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Create your first assessment to get started"}
                  </p>
                </td>
              </tr>
            )}

            {/* Table Rows */}
            {rows.map((test, i) => {
              const statusStyle = STATUS_CONFIG[test.status as keyof typeof STATUS_CONFIG];
              const ScoringIcon = test.scoringMethod
                ? (SCORING_ICON_MAP[test.scoringMethod] ?? FileText)
                : FileText;
              const scoringLabel = test.scoringMethod
                ? (SCORING_LABELS[test.scoringMethod] ?? "—")
                : "—";

              return (
                <tr
                  key={test.id}
                  className="admin-row-hover"
                  style={{
                    borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none",
                    background: i % 2 === 1 ? "#FBFAFD" : WHITE,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    window.location.href = `/admin/assessments/${test.id}`;
                  }}
                >
                  {/* Title + Category */}
                  <td style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: DARK_TEXT,
                        marginBottom: 2,
                      }}
                    >
                      {test.title}
                    </div>
                    <div style={{ fontSize: 11, color: LIGHT_TEXT }}>{test.category}</div>
                  </td>

                  {/* Slug */}
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        color: MID_TEXT,
                        background: "#F0EDF5",
                        padding: "3px 8px",
                        borderRadius: 6,
                        display: "inline-block",
                      }}
                    >
                      {test.slug}
                    </span>
                  </td>

                  {/* Scoring Method */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <ScoringIcon size={13} style={{ color: MID_TEXT, opacity: 0.7 }} />
                      <span style={{ fontSize: 12, color: MID_TEXT }}>{scoringLabel}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      className="admin-pill"
                      style={{
                        background: statusStyle?.bg,
                        color: statusStyle?.color,
                        border: `1px solid ${statusStyle?.border}`,
                      }}
                    >
                      {statusStyle?.label}
                    </span>
                  </td>

                  {/* Session Count */}
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        color: test.sessionCount > 0 ? WARNING : LIGHT_TEXT,
                      }}
                    >
                      {test.sessionCount > 0 && <Users size={12} style={{ color: WARNING }} />}
                      {test.sessionCount}
                    </span>
                  </td>

                  {/* Question Count */}
                  <td
                    style={{
                      padding: "14px 16px",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 500,
                      color: test.questionCount === 0 ? RED : DARK_TEXT,
                    }}
                  >
                    {test.questionCount === 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <AlertTriangle size={12} />0
                      </span>
                    ) : (
                      test.questionCount
                    )}
                  </td>

                  {/* Actions */}
                  <td
                    style={{ padding: "14px 16px", textAlign: "right" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusActions test={test} onRefresh={() => testsQuery.refetch()} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Create Sheet ── */}
      <CreateTestSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={() => {
          testsQuery.refetch();
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}
