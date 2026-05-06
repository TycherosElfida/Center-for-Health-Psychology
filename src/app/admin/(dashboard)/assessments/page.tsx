/**
 * Admin Assessments List Page
 *
 * Server-rendered shell for the assessment management view.
 * Delegates interactive functionality to _components/AssessmentsClient.
 */
"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { Search, Plus, FileText, BarChart3, GitBranch, Users, AlertTriangle } from "lucide-react";
import { CreateTestSheet } from "./_components/CreateTestSheet";
import { StatusActions } from "./_components/StatusActions";

/* ── Design Tokens (consistent with admin.css) ───────────────── */
const DT = {
  DARK_TEXT: "#1E1830",
  MID_TEXT: "#6B5CA0",
  LIGHT_TEXT: "#8B7CB8",
  BORDER: "#E2DCF0",
  WHITE: "#FFFFFF",
  BG: "#F5F3FA",
  BRAND: "#9B8EC4",
  BRAND_DEEP: "#6B5CA0",
} as const;

/* ── Status badge config ─────────────────────────────────────── */
const STATUS_CONFIG = {
  draft: { label: "Draft", bg: "#F0EDF5", color: "#6B5CA0", border: "#D6CEE8" },
  published: { label: "Published", bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" },
  archived: { label: "Archived", bg: "#F5F5F5", color: "#757575", border: "#E0E0E0" },
} as const;

/* ── Scoring method badge config ─────────────────────────────── */
const SCORING_CONFIG = {
  summative: { label: "Summative", icon: BarChart3 },
  dimensional: { label: "Dimensional", icon: GitBranch },
  binary_cluster: { label: "Binary Cluster", icon: FileText },
} as const;

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
              fontSize: "1.5rem",
              fontWeight: 700,
              color: DT.DARK_TEXT,
              margin: 0,
              letterSpacing: "-0.015em",
            }}
          >
            Assessment Instruments
          </h1>
          <p style={{ fontSize: 13, color: DT.LIGHT_TEXT, margin: "4px 0 0" }}>
            Create, edit, and manage assessment lifecycle
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: `linear-gradient(135deg, ${DT.BRAND}, ${DT.BRAND_DEEP})`,
            color: DT.WHITE,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s ease, transform 0.15s ease",
            boxShadow: `0 2px 12px ${DT.BRAND}40`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Plus size={16} />
          New Assessment
        </button>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["all", "draft", "published", "archived"] as const).map((tab) => {
          const isActive = statusFilter === tab;
          const count = statusCounts[tab];
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: `1.5px solid ${isActive ? DT.BRAND : DT.BORDER}`,
                background: isActive ? `${DT.BRAND}10` : DT.WHITE,
                color: isActive ? DT.BRAND_DEEP : DT.MID_TEXT,
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                textTransform: "capitalize",
              }}
            >
              {tab}
              <span
                style={{
                  background: isActive ? `${DT.BRAND}20` : "#F0EDF5",
                  color: isActive ? DT.BRAND_DEEP : DT.LIGHT_TEXT,
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontSize: 11,
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
            color: DT.LIGHT_TEXT,
          }}
        />
        <input
          type="text"
          placeholder="Search by title, slug, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 40px",
            borderRadius: 10,
            border: `1.5px solid ${DT.BORDER}`,
            background: DT.WHITE,
            fontSize: 13,
            color: DT.DARK_TEXT,
            outline: "none",
            transition: "border-color 0.15s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = DT.BRAND;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = DT.BORDER;
          }}
        />
      </div>

      {/* ── Data Table ── */}
      <div
        style={{
          background: DT.WHITE,
          borderRadius: 14,
          border: `1px solid ${DT.BORDER}`,
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.2fr 1fr 1fr 80px 80px 120px",
            gap: 0,
            padding: "12px 20px",
            background: "#FBFAFD",
            borderBottom: `1px solid ${DT.BORDER}`,
            fontSize: 11,
            fontWeight: 600,
            color: DT.LIGHT_TEXT,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <div>Title</div>
          <div>Slug</div>
          <div>Scoring</div>
          <div>Status</div>
          <div style={{ textAlign: "center" }}>Sessions</div>
          <div style={{ textAlign: "center" }}>Questions</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {/* Loading State */}
        {testsQuery.isLoading && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="admin-skeleton"
                style={{ height: 48, marginBottom: 8, borderRadius: 8 }}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {testsQuery.isSuccess && rows.length === 0 && (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: DT.LIGHT_TEXT,
            }}
          >
            <FileText size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>
              {search || statusFilter !== "all" ? "No matching assessments" : "No assessments yet"}
            </p>
            <p style={{ fontSize: 12, margin: 0 }}>
              {search || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first assessment to get started"}
            </p>
          </div>
        )}

        {/* Table Rows */}
        {rows.map((test, i) => {
          const statusStyle = STATUS_CONFIG[test.status as keyof typeof STATUS_CONFIG];
          const scoringInfo = test.scoringMethod
            ? SCORING_CONFIG[test.scoringMethod as keyof typeof SCORING_CONFIG]
            : null;
          const ScoringIcon = scoringInfo?.icon ?? FileText;

          return (
            <div
              key={test.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.2fr 1fr 1fr 80px 80px 120px",
                gap: 0,
                padding: "14px 20px",
                borderBottom: i < rows.length - 1 ? `1px solid ${DT.BORDER}` : "none",
                background: i % 2 === 1 ? "#FBFAFD" : DT.WHITE,
                alignItems: "center",
                transition: "background 0.1s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${DT.BRAND}06`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = i % 2 === 1 ? "#FBFAFD" : DT.WHITE;
              }}
              onClick={() => {
                window.location.href = `/admin/assessments/${test.id}`;
              }}
            >
              {/* Title */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: DT.DARK_TEXT,
                    marginBottom: 2,
                  }}
                >
                  {test.title}
                </div>
                <div style={{ fontSize: 11, color: DT.LIGHT_TEXT }}>{test.category}</div>
              </div>

              {/* Slug */}
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  color: DT.MID_TEXT,
                  background: "#F0EDF5",
                  padding: "3px 8px",
                  borderRadius: 6,
                  display: "inline-block",
                  maxWidth: "fit-content",
                }}
              >
                {test.slug}
              </div>

              {/* Scoring Method */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ScoringIcon size={14} style={{ color: DT.MID_TEXT, opacity: 0.7 }} />
                <span style={{ fontSize: 12, color: DT.MID_TEXT }}>
                  {scoringInfo?.label ?? "—"}
                </span>
              </div>

              {/* Status Badge */}
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: statusStyle?.bg,
                    color: statusStyle?.color,
                    border: `1px solid ${statusStyle?.border}`,
                  }}
                >
                  {statusStyle?.label}
                </span>
              </div>

              {/* Session Count */}
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    color: test.sessionCount > 0 ? "#E65100" : DT.LIGHT_TEXT,
                  }}
                >
                  {test.sessionCount > 0 && <Users size={12} style={{ color: "#E65100" }} />}
                  {test.sessionCount}
                </span>
              </div>

              {/* Question Count */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 500,
                  color: test.questionCount === 0 ? "#E53935" : DT.DARK_TEXT,
                }}
              >
                {test.questionCount === 0 ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={12} />0
                  </span>
                ) : (
                  test.questionCount
                )}
              </div>

              {/* Actions */}
              <div style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                <StatusActions test={test} onRefresh={() => testsQuery.refetch()} />
              </div>
            </div>
          );
        })}
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
