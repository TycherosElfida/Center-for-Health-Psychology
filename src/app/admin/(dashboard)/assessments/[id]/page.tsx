/**
 * Assessment Edit Page — /admin/assessments/[id]
 *
 * Full-page edit view for a single assessment instrument.
 * Navigation: entered via window.location.href (admin cookie rule).
 *
 * Features:
 * - Tab system: Identity (form) | Questions (QuestionManager) | Scales (ScaleManager)
 * - Structural lock indicators (slug/scoringMethod when sessions > 0)
 * - Status lifecycle actions (same as list view)
 * - Field-level editing with save
 * - Session count warning badge
 *
 * UI Remake: restyled to match DesignReference/AssessmentManagementPage.tsx
 *
 * Reviewed fixes applied:
 * - createdAt serialized at server→client boundary (ISO strings from tRPC)
 * - Empty string coercion on submit
 * - Uses window.location.href for back navigation, not router.push
 * - Tab state managed via useState (no useSearchParams / Suspense needed)
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
  ClipboardList,
  BarChart2,
} from "lucide-react";
import { StatusActions } from "../_components/StatusActions";
import { CreatableSelect } from "../../../_components/CreatableSelect";
import { QuestionManager } from "./_components/QuestionManager";
import { ScaleManager } from "./_components/ScaleManager";
import {
  BRAND_DEEP,
  WHITE,
  DARK_TEXT,
  LIGHT_TEXT,
  BORDER,
  RED,
  GREEN,
  GREEN_LIGHT,
  GREEN_BORDER,
  WARNING,
  RED_LIGHT,
  RED_BORDER,
  STATUS_CONFIG,
  inputStyle as sharedInputStyle,
  onInputFocus,
  onInputBlur,
} from "../../../_components/DesignTokens";

type ScoringMethodType = "summative" | "dimensional" | "binary_cluster";
type EditorTab = "identity" | "questions" | "scales";

function buildFormFromData(d: {
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  estimatedMinutes: number | null;
  scoringMethod: string | null;
  instructions: string | null;
  thumbnailUrl: string | null;
  abbreviation: string | null;
  releaseYear: number | null;
  author: string | null;
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
    abbreviation: d.abbreviation ?? "",
    releaseYear: d.releaseYear !== null ? String(d.releaseYear) : "",
    author: d.author ?? "",
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
  abbreviation: "",
  releaseYear: "",
  author: "",
};

/* ── Derived style helpers ─────────────────────────────────────── */
const lblStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: DARK_TEXT,
  marginBottom: 6,
};

const lockedInputStyle: React.CSSProperties = {
  ...sharedInputStyle,
  background: "#F5F3FA",
  color: LIGHT_TEXT,
  cursor: "not-allowed",
};

const selectStyle: React.CSSProperties = {
  ...sharedInputStyle,
  cursor: "pointer",
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};

export default function AssessmentEditPage() {
  const params = useParams<{ id: string }>();
  const testId = params.id;

  const [activeTab, setActiveTab] = useState<EditorTab>("identity");

  const testQuery = trpc.adminTests.getTestById.useQuery(
    { id: testId },
    { enabled: !!testId, refetchOnWindowFocus: false }
  );

  const categoriesQuery = trpc.adminTests.getCategories.useQuery({});
  const categories = categoriesQuery.data ?? [];

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
        <AlertCircle size={40} style={{ color: RED, margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: DARK_TEXT, fontWeight: 600 }}>Assessment not found</p>
        <button
          className="admin-btn-secondary"
          onClick={() => {
            window.location.href = "/admin/assessments";
          }}
          style={{ marginTop: 12 }}
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
      abbreviation: form.abbreviation,
      releaseYear: form.releaseYear ? parseInt(form.releaseYear, 10) : null,
      author: form.author || null,
    });
  }

  return (
    <div className="admin-fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            className="admin-btn-ghost"
            onClick={() => {
              window.location.href = "/admin/assessments";
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: DARK_TEXT,
                margin: 0,
                letterSpacing: "-0.01em",
                fontFamily: "'DM Sans', 'Inter', sans-serif",
              }}
            >
              {test.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span
                className="admin-pill"
                style={{
                  background: statusStyle?.bg,
                  color: statusStyle?.color,
                  border: `1px solid ${statusStyle?.border}`,
                  fontSize: 10,
                  padding: "2px 8px",
                }}
              >
                {statusStyle?.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: LIGHT_TEXT,
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
            className="admin-pill"
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: test.sessionCount > 0 ? "#FFF3E0" : "#F5F3FA",
              border: `1px solid ${test.sessionCount > 0 ? "#FFE0B2" : BORDER}`,
              fontSize: 11,
              color: test.sessionCount > 0 ? WARNING : LIGHT_TEXT,
            }}
          >
            <Users size={12} style={{ marginRight: 4 }} />
            {test.sessionCount} sessions
          </div>
          <div
            className="admin-pill"
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: test.questionCount === 0 ? RED_LIGHT : "#F5F3FA",
              border: `1px solid ${test.questionCount === 0 ? RED_BORDER : BORDER}`,
              fontSize: 11,
              color: test.questionCount === 0 ? RED : LIGHT_TEXT,
            }}
          >
            <FileText size={12} style={{ marginRight: 4 }} />
            {test.questionCount} questions
          </div>
          <StatusActions test={test} onRefresh={() => testQuery.refetch()} />
        </div>
      </div>

      {/* ── Tab Navigation (DesignReference pill-tab pattern) ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "#F0EDF6",
          borderRadius: 12,
          padding: 4,
          maxWidth: 320,
        }}
      >
        {[
          { key: "identity" as const, label: "Identity", icon: ClipboardList },
          { key: "questions" as const, label: "Questions", icon: FileText },
          { key: "scales" as const, label: "Scales", icon: BarChart2 },
        ].map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
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
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Structural Lock Warning ── */}
      {isStructurallyLocked && activeTab === "identity" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 10,
            background: "#FFF8E1",
            border: "1px solid #FFE082",
            marginBottom: 20,
            fontSize: 12,
            color: "#5D4037",
          }}
        >
          <AlertTriangle size={16} style={{ color: WARNING, flexShrink: 0 }} />
          <div>
            <strong>Structural lock active.</strong> Slug and scoring method cannot be changed
            because {test.sessionCount} session(s) have been recorded against this assessment.
          </div>
        </div>
      )}

      {/* ── Identity Tab Content ── */}
      {activeTab === "identity" && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: WHITE,
            borderRadius: 14,
            border: `1px solid ${BORDER}`,
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
              <label style={lblStyle}>Title</label>
              <input
                type="text"
                required
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                style={sharedInputStyle}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              />
            </div>

            {/* Slug — locked when structural lock active */}
            <div>
              <label style={lblStyle}>
                Slug
                {isStructurallyLocked && <Lock size={11} style={{ color: WARNING }} />}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                disabled={isStructurallyLocked}
                style={{
                  ...(isStructurallyLocked ? lockedInputStyle : sharedInputStyle),
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                }}
                onFocus={(e) => {
                  if (!isStructurallyLocked) onInputFocus(e);
                }}
                onBlur={onInputBlur}
              />
            </div>

            {/* Abbreviation */}
            <div>
              <label style={lblStyle}>Abbreviation</label>
              <input
                type="text"
                required
                maxLength={50}
                value={form.abbreviation}
                onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value }))}
                style={sharedInputStyle}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              />
            </div>

            {/* Author */}
            <div>
              <label style={lblStyle}>Author</label>
              <input
                type="text"
                maxLength={200}
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                style={sharedInputStyle}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              />
            </div>

            {/* Release Year */}
            <div>
              <label style={lblStyle}>Release Year</label>
              <input
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                placeholder={String(new Date().getFullYear())}
                value={form.releaseYear}
                onChange={(e) => setForm((f) => ({ ...f, releaseYear: e.target.value }))}
                style={sharedInputStyle}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              />
            </div>

            {/* Category */}
            <div>
              <label style={lblStyle}>Category</label>
              <CreatableSelect
                value={form.category}
                onChange={(val: string) => setForm((f) => ({ ...f, category: val }))}
                options={categories}
                disabled={false}
                placeholder="Select or type to create a new category..."
              />
            </div>

            {/* Estimated Minutes */}
            <div>
              <label style={lblStyle}>Estimated Minutes</label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={form.estimatedMinutes}
                onChange={(e) => setForm((f) => ({ ...f, estimatedMinutes: e.target.value }))}
                style={sharedInputStyle}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              />
            </div>

            {/* Scoring Method — locked when structural lock active */}
            <div>
              <label style={lblStyle}>
                Scoring Method
                {isStructurallyLocked && <Lock size={11} style={{ color: WARNING }} />}
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
                  ...(isStructurallyLocked ? lockedInputStyle : selectStyle),
                  cursor: isStructurallyLocked ? "not-allowed" : "pointer",
                }}
              >
                <option value="summative">Summative</option>
                <option value="dimensional">Dimensional</option>
                <option value="binary_cluster">Binary Cluster</option>
              </select>
            </div>

            {/* Thumbnail URL */}
            <div>
              <label style={lblStyle}>Thumbnail URL</label>
              <input
                type="text"
                maxLength={500}
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                placeholder="https://..."
                style={sharedInputStyle}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              />
            </div>
          </div>

          {/* Description — full width */}
          <div style={{ marginBottom: 20 }}>
            <label style={lblStyle}>Description</label>
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the assessment..."
              rows={3}
              style={{ ...sharedInputStyle, resize: "vertical", minHeight: 72 }}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
            />
          </div>

          {/* Instructions — full width */}
          <div style={{ marginBottom: 24 }}>
            <label style={lblStyle}>Instructions</label>
            <textarea
              maxLength={5000}
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              placeholder="Instructions shown to participants before starting..."
              rows={4}
              style={{ ...sharedInputStyle, resize: "vertical", minHeight: 80 }}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
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
                background: RED_LIGHT,
                border: `1px solid ${RED_BORDER}`,
                fontSize: 12,
                color: RED,
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
              className="admin-success-flash"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                background: GREEN_LIGHT,
                border: `1px solid ${GREEN_BORDER}`,
                fontSize: 12,
                color: GREEN,
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
              className="admin-btn-primary"
              style={{
                opacity: updateMutation.isPending ? 0.6 : 1,
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
      )}

      {/* ── Questions Tab Content ── */}
      {activeTab === "questions" && (
        <QuestionManager testId={testId} sessionCount={test.sessionCount} />
      )}

      {/* ── Scales Tab Content ── */}
      {activeTab === "scales" && <ScaleManager testId={testId} />}

      {/* ── Metadata Footer ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 4px",
          fontSize: 11,
          color: LIGHT_TEXT,
        }}
      >
        <span>Created: {new Date(test.createdAt).toLocaleDateString("id-ID")}</span>
        <span>Last updated: {new Date(test.updatedAt).toLocaleDateString("id-ID")}</span>
        <span>Version: {test.version}</span>
      </div>
    </div>
  );
}
