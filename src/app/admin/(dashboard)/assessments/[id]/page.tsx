/**
 * Assessment Edit Page — /admin/assessments/[id]
 *
 * Full-page edit view for a single assessment instrument.
 * Navigation: entered via window.location.href (admin cookie rule).
 *
 * Features:
 * - Structural lock indicators (slug/scoringMethod when sessions > 0)
 * - Status lifecycle actions (same as list view)
 * - Field-level editing with save
 * - Session count warning badge
 *
 * Reviewed fixes applied:
 * - createdAt serialized at server→client boundary (ISO strings from tRPC)
 * - Empty string coercion on submit
 * - Uses window.location.href for back navigation, not router.push
 */
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  Users,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { StatusActions } from "../_components/StatusActions";

/* ── Design Tokens ───────────────────────────────────────────── */
const DT = {
  DARK_TEXT: "#1E1830",
  MID_TEXT: "#6B5CA0",
  LIGHT_TEXT: "#8B7CB8",
  BORDER: "#E2DCF0",
  WHITE: "#FFFFFF",
  BG: "#F5F3FA",
  BRAND: "#9B8EC4",
  BRAND_DEEP: "#6B5CA0",
  ERROR: "#E53935",
  SUCCESS: "#2E7D32",
  WARNING: "#E65100",
} as const;

const STATUS_CONFIG = {
  draft: { label: "Draft", bg: "#F0EDF5", color: "#6B5CA0", border: "#D6CEE8" },
  published: { label: "Published", bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" },
  archived: { label: "Archived", bg: "#F5F5F5", color: "#757575", border: "#E0E0E0" },
} as const;

type ScoringMethodType = "summative" | "dimensional" | "binary_cluster";

function buildFormFromData(d: {
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  estimatedMinutes: number | null;
  scoringMethod: string | null;
  instructions: string | null;
  thumbnailUrl: string | null;
}) {
  return {
    title: d.title,
    slug: d.slug,
    description: d.description ?? "",
    category: d.category ?? "",
    estimatedMinutes: String(d.estimatedMinutes ?? ""),
    scoringMethod: (d.scoringMethod ?? "summative") as ScoringMethodType,
    instructions: d.instructions ?? "",
    thumbnailUrl: d.thumbnailUrl ?? "",
  };
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  description: "",
  category: "",
  estimatedMinutes: "",
  scoringMethod: "summative" as ScoringMethodType,
  instructions: "",
  thumbnailUrl: "",
};

export default function AssessmentEditPage() {
  const params = useParams<{ id: string }>();
  const testId = params.id;

  const testQuery = trpc.adminTests.getTestById.useQuery(
    { id: testId },
    { enabled: !!testId, refetchOnWindowFocus: false }
  );

  const updateMutation = trpc.adminTests.updateTest.useMutation({
    onSuccess: () => {
      testQuery.refetch();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  // Hydrate form from query data using React's official
  // "adjusting state from changing props" pattern (no refs, no effects).
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-when-a-prop-changes
  const [prevData, setPrevData] = useState<unknown>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  if (testQuery.data && prevData !== testQuery.data) {
    setPrevData(testQuery.data);
    setForm(buildFormFromData(testQuery.data));
  }

  const [saveSuccess, setSaveSuccess] = useState(false);

  if (testQuery.isLoading) {
    return (
      <div className="admin-fade-in" style={{ padding: "40px 0", textAlign: "center" }}>
        <div className="admin-skeleton" style={{ width: 300, height: 24, margin: "0 auto 16px" }} />
        <div className="admin-skeleton" style={{ width: 200, height: 16, margin: "0 auto" }} />
      </div>
    );
  }

  if (testQuery.error || !testQuery.data) {
    return (
      <div className="admin-fade-in" style={{ padding: "60px 0", textAlign: "center" }}>
        <AlertCircle size={40} style={{ color: DT.ERROR, margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: DT.DARK_TEXT, fontWeight: 600 }}>Assessment not found</p>
        <button
          onClick={() => {
            window.location.href = "/admin/assessments";
          }}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${DT.BORDER}`,
            background: DT.WHITE,
            color: DT.MID_TEXT,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const test = testQuery.data;
  const statusStyle = STATUS_CONFIG[test.status as keyof typeof STATUS_CONFIG];
  const isStructurallyLocked = test.sessionCount > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const minutes = parseInt(form.estimatedMinutes, 10);
    if (isNaN(minutes) || minutes < 1) return;

    updateMutation.mutate({
      id: testId,
      title: form.title,
      slug: form.slug,
      description: form.description || "",
      category: form.category,
      estimatedMinutes: minutes,
      scoringMethod: form.scoringMethod,
      instructions: form.instructions || "",
      thumbnailUrl: form.thumbnailUrl || "",
    });
  }

  /* ── Shared styles ── */
  const labelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: DT.DARK_TEXT,
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1.5px solid ${DT.BORDER}`,
    background: DT.WHITE,
    fontSize: 13,
    color: DT.DARK_TEXT,
    outline: "none",
    transition: "border-color 0.15s ease",
    fontFamily: "'Inter', sans-serif",
  };

  const lockedInputStyle: React.CSSProperties = {
    ...inputStyle,
    background: "#F5F3FA",
    color: DT.LIGHT_TEXT,
    cursor: "not-allowed",
  };

  return (
    <div className="admin-fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => {
              window.location.href = "/admin/assessments";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${DT.BORDER}`,
              background: DT.WHITE,
              color: DT.MID_TEXT,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: DT.DARK_TEXT,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {test.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 600,
                  background: statusStyle?.bg,
                  color: statusStyle?.color,
                  border: `1px solid ${statusStyle?.border}`,
                }}
              >
                {statusStyle?.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: DT.LIGHT_TEXT,
                }}
              >
                {test.slug}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Session/Question count badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: test.sessionCount > 0 ? "#FFF3E0" : "#F5F3FA",
              border: `1px solid ${test.sessionCount > 0 ? "#FFE0B2" : DT.BORDER}`,
              fontSize: 11,
              fontWeight: 600,
              color: test.sessionCount > 0 ? DT.WARNING : DT.LIGHT_TEXT,
            }}
          >
            <Users size={12} />
            {test.sessionCount} sessions
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: test.questionCount === 0 ? "#FFF5F5" : "#F5F3FA",
              border: `1px solid ${test.questionCount === 0 ? "#FFCDD2" : DT.BORDER}`,
              fontSize: 11,
              fontWeight: 600,
              color: test.questionCount === 0 ? DT.ERROR : DT.LIGHT_TEXT,
            }}
          >
            <FileText size={12} />
            {test.questionCount} questions
          </div>
          <StatusActions test={test} onRefresh={() => testQuery.refetch()} />
        </div>
      </div>

      {/* ── Structural Lock Warning ── */}
      {isStructurallyLocked && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 10,
            background: "#FFF8E1",
            border: "1px solid #FFE082",
            marginBottom: 24,
            fontSize: 12,
            color: "#5D4037",
          }}
        >
          <AlertTriangle size={16} style={{ color: DT.WARNING, flexShrink: 0 }} />
          <div>
            <strong>Structural lock active.</strong> Slug and scoring method cannot be changed
            because {test.sessionCount} session(s) have been recorded against this assessment.
          </div>
        </div>
      )}

      {/* ── Edit Form ── */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: DT.WHITE,
          borderRadius: 14,
          border: `1px solid ${DT.BORDER}`,
          padding: 28,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 20,
          }}
        >
          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
          </div>

          {/* Slug — locked when structural lock active */}
          <div>
            <label style={labelStyle}>
              Slug
              {isStructurallyLocked && <Lock size={11} style={{ color: DT.WARNING }} />}
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              disabled={isStructurallyLocked}
              style={{
                ...(isStructurallyLocked ? lockedInputStyle : inputStyle),
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
              }}
              onFocus={(e) => {
                if (!isStructurallyLocked) e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
          </div>

          {/* Estimated Minutes */}
          <div>
            <label style={labelStyle}>Estimated Minutes</label>
            <input
              type="number"
              required
              min={1}
              max={120}
              value={form.estimatedMinutes}
              onChange={(e) => setForm((f) => ({ ...f, estimatedMinutes: e.target.value }))}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
          </div>

          {/* Scoring Method — locked when structural lock active */}
          <div>
            <label style={labelStyle}>
              Scoring Method
              {isStructurallyLocked && <Lock size={11} style={{ color: DT.WARNING }} />}
            </label>
            <select
              required
              value={form.scoringMethod}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  scoringMethod: e.target.value as typeof form.scoringMethod,
                }))
              }
              disabled={isStructurallyLocked}
              style={{
                ...(isStructurallyLocked ? lockedInputStyle : inputStyle),
                cursor: isStructurallyLocked ? "not-allowed" : "pointer",
                appearance: "none" as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B7CB8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: 32,
              }}
            >
              <option value="summative">Summative</option>
              <option value="dimensional">Dimensional</option>
              <option value="binary_cluster">Binary Cluster</option>
            </select>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label style={labelStyle}>Thumbnail URL</label>
            <input
              type="text"
              maxLength={500}
              value={form.thumbnailUrl}
              onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
              placeholder="https://..."
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
          </div>
        </div>

        {/* Description — full width */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Description</label>
          <textarea
            maxLength={1000}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of the assessment..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = DT.BRAND;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = DT.BORDER;
            }}
          />
        </div>

        {/* Instructions — full width */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Instructions</label>
          <textarea
            maxLength={5000}
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            placeholder="Instructions shown to participants before starting..."
            rows={4}
            style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = DT.BRAND;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = DT.BORDER;
            }}
          />
        </div>

        {/* Error */}
        {updateMutation.error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 8,
              background: "#FFF5F5",
              border: "1px solid #FFCDD2",
              fontSize: 12,
              color: DT.ERROR,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            {updateMutation.error.message}
          </div>
        )}

        {/* Success */}
        {saveSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 8,
              background: "#E8F5E9",
              border: "1px solid #A5D6A7",
              fontSize: 12,
              color: DT.SUCCESS,
              marginBottom: 16,
            }}
          >
            <CheckCircle size={14} />
            Changes saved.
          </div>
        )}

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: `linear-gradient(135deg, ${DT.BRAND}, ${DT.BRAND_DEEP})`,
              color: DT.WHITE,
              fontSize: 13,
              fontWeight: 600,
              cursor: updateMutation.isPending ? "not-allowed" : "pointer",
              opacity: updateMutation.isPending ? 0.6 : 1,
              transition: "opacity 0.15s ease, transform 0.15s ease",
              boxShadow: `0 2px 12px ${DT.BRAND}40`,
            }}
            onMouseEnter={(e) => {
              if (!updateMutation.isPending) {
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 size={14} className="admin-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Metadata Footer ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 4px",
          fontSize: 11,
          color: DT.LIGHT_TEXT,
        }}
      >
        <span>Created: {new Date(test.createdAt).toLocaleDateString("id-ID")}</span>
        <span>Last updated: {new Date(test.updatedAt).toLocaleDateString("id-ID")}</span>
        <span>Version: {test.version}</span>
      </div>
    </div>
  );
}
