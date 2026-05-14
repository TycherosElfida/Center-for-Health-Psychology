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
  Image as ImageIcon,
  X,
} from "lucide-react";
import { StatusActions } from "../_components/StatusActions";
import { CreatableSelect } from "../../../_components/CreatableSelect";
import { QuestionManager } from "./_components/QuestionManager";
import { ScaleManager } from "./_components/ScaleManager";
import {
  BRAND,
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
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

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

    updateMutation.mutate({
      id: testId,
      title: form.title,
      slug: form.slug,
      description: form.description || "",
      category: form.category,
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
          { key: "questions" as const, label: "Questions", icon: ClipboardList },
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
              gap: 24,
            }}
          >
            {/* ── Left Column ── */}
            <div>
              {/* Title */}
              <div style={{ marginBottom: 18 }}>
                <label style={lblStyle}>Assessment Name</label>
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

              {/* Abbreviation */}
              <div style={{ marginBottom: 18 }}>
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

              {/* Slug (Only visible if needed or locked, let's keep it under abbreviation) */}
              <div style={{ marginBottom: 18 }}>
                <label style={lblStyle}>
                  Slug
                  {isStructurallyLocked && (
                    <Lock size={11} style={{ color: WARNING, marginLeft: 4 }} />
                  )}
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

              {/* Cover Photo / Thumbnail Upload */}
              <div style={{ marginBottom: 18 }}>
                <label style={lblStyle}>Cover Photo</label>
                {thumbnailError && (
                  <div style={{ fontSize: 12, color: RED, marginBottom: 8 }}>{thumbnailError}</div>
                )}
                {form.thumbnailUrl ? (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 160,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: `1px solid ${BORDER}`,
                      backgroundImage: `url(${form.thumbnailUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, thumbnailUrl: "" }))}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                      title="Remove image"
                    >
                      <X size={14} style={{ color: DARK_TEXT }} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: 160,
                      borderRadius: 12,
                      border: `2px dashed ${BORDER}`,
                      background: "#FAFAFA",
                      cursor: isUploadingThumbnail ? "wait" : "pointer",
                      transition: "all 0.2s ease",
                      opacity: isUploadingThumbnail ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: "none" }}
                      disabled={isUploadingThumbnail}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (file.size > 2 * 1024 * 1024) {
                          setThumbnailError("File size must be under 2MB");
                          return;
                        }

                        setIsUploadingThumbnail(true);
                        setThumbnailError(null);

                        try {
                          const formData = new FormData();
                          formData.append("file", file);

                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });

                          if (!res.ok) {
                            throw new Error("Upload failed");
                          }

                          const data = await res.json();
                          if (data.url) {
                            setForm((f) => ({ ...f, thumbnailUrl: data.url }));
                          } else {
                            throw new Error("No URL returned");
                          }
                        } catch (err) {
                          console.error("Upload error:", err);
                          setThumbnailError("Failed to upload image. Please try again.");
                        } finally {
                          setIsUploadingThumbnail(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    {isUploadingThumbnail ? (
                      <>
                        <Loader2
                          size={24}
                          style={{ color: LIGHT_TEXT, marginBottom: 12 }}
                          className="admin-spin"
                        />
                        <span style={{ fontSize: 13, color: LIGHT_TEXT, fontWeight: 500 }}>
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            background: WHITE,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          <ImageIcon size={20} style={{ color: LIGHT_TEXT }} />
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: DARK_TEXT,
                            marginBottom: 4,
                          }}
                        >
                          Click to upload cover photo
                        </span>
                        <span style={{ fontSize: 12, color: LIGHT_TEXT }}>
                          SVG, PNG, JPG or WEBP (max. 2MB)
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Release Year */}
              <div style={{ marginBottom: 18 }}>
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
              <div style={{ marginBottom: 18 }}>
                <label style={lblStyle}>Category</label>
                <CreatableSelect
                  value={form.category}
                  onChange={(val: string) => setForm((f) => ({ ...f, category: val }))}
                  options={categories}
                  disabled={false}
                  placeholder="Select or type to create a new category..."
                />
              </div>

              {/* Author */}
              <div style={{ marginBottom: 18 }}>
                <label style={lblStyle}>Assessment&apos;s Author</label>
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

              {/* Scoring Method */}
              <div style={{ marginBottom: 18 }}>
                <label style={lblStyle}>
                  Scoring Method
                  {isStructurallyLocked && (
                    <Lock size={11} style={{ color: WARNING, marginLeft: 4 }} />
                  )}
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
                    width: "100%",
                  }}
                >
                  <option value="summative">Summative</option>
                  <option value="dimensional">Dimensional</option>
                  <option value="binary_cluster">Binary Cluster</option>
                </select>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div>
              {/* Description */}
              <div style={{ marginBottom: 18 }}>
                <label style={lblStyle}>Full Description</label>
                <textarea
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the assessment..."
                  rows={4}
                  style={{ ...sharedInputStyle, resize: "vertical", minHeight: 90 }}
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                />
              </div>

              {/* Instructions */}
              <div style={{ marginBottom: 18 }}>
                <label style={lblStyle}>Instructions</label>
                <textarea
                  maxLength={5000}
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="Instructions shown to participants before starting..."
                  rows={4}
                  style={{ ...sharedInputStyle, resize: "vertical", minHeight: 90 }}
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                />
              </div>

              {/* Assessment Summary Box */}
              <div style={{ background: "#F9F7FD", borderRadius: 12, padding: 16, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <AlertCircle size={14} style={{ color: BRAND }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: DARK_TEXT }}>
                    Assessment Summary
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div
                    style={{
                      background: WHITE,
                      borderRadius: 8,
                      padding: "10px 14px",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <div style={{ fontSize: 10, color: LIGHT_TEXT, marginBottom: 2 }}>
                      Questions
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: BRAND_DEEP }}>
                      {test.questionCount}
                    </div>
                  </div>
                  <div
                    style={{
                      background: WHITE,
                      borderRadius: 8,
                      padding: "10px 14px",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <div style={{ fontSize: 10, color: LIGHT_TEXT, marginBottom: 2 }}>
                      Sessions Completed
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: BRAND_DEEP }}>
                      {test.sessionCount}
                    </div>
                  </div>
                  <div
                    style={{
                      background: WHITE,
                      borderRadius: 8,
                      padding: "10px 14px",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <div style={{ fontSize: 10, color: LIGHT_TEXT, marginBottom: 2 }}>Version</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: BRAND_DEEP }}>
                      v{test.version}
                    </div>
                  </div>
                  <div
                    style={{
                      background: WHITE,
                      borderRadius: 8,
                      padding: "10px 14px",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <div style={{ fontSize: 10, color: LIGHT_TEXT, marginBottom: 2 }}>Type</div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: BRAND_DEEP,
                        textTransform: "capitalize",
                        marginTop: 2,
                      }}
                    >
                      {(test.scoringMethod || "summative").replace("_", " ")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
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
          </div>{" "}
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
