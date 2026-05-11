"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Lock,
  AlertTriangle,
  BarChart2,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Check,
  Loader2,
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
  RED,
  RED_LIGHT,
  RED_BORDER,
  GREEN,
  WARNING,
  WARNING_BG,
  WARNING_BORDER,
  inputStyle,
  lockedInputStyle,
  labelStyle,
  onInputFocus,
  onInputBlur,
} from "../../../../_components/DesignTokens";

// ── Types ────────────────────────────────────────────────────────────

type RangeData = {
  id: string;
  minScore: string;
  maxScore: string;
  label: string;
  description: string;
  recommendation: string | null;
  severity: string;
};

type EditState = {
  label: string;
  minScore: string;
  maxScore: string;
  description: string;
  recommendation: string;
  severity: string;
};

type AddSubscaleState = EditState & {
  subscaleName: string;
};

// ── Constants ────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  low: { bg: "#DCFCE7", color: "#166534", label: "Low" },
  moderate: { bg: "#FEF9C3", color: "#854D0E", label: "Moderate" },
  high: { bg: "#FED7AA", color: "#9A3412", label: "High" },
  critical: { bg: "#FECACA", color: "#991B1B", label: "Critical" },
};

const SAVE_FLASH_MS = 2000;

// ── Component ────────────────────────────────────────────────────────

interface ScaleManagerProps {
  testId: string;
}

export function ScaleManager({ testId }: ScaleManagerProps) {
  // ── Data fetching ──────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = trpc.adminScales.getScaleConfig.useQuery(
    { testId },
    { enabled: !!testId }
  );

  // ── Mutations ──────────────────────────────────────────────────────
  const updateMutation = trpc.adminScales.updateRange.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const addMutation = trpc.adminScales.addRange.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const deleteMutation = trpc.adminScales.deleteRange.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  // ── Local state ────────────────────────────────────────────────────
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [editingRangeId, setEditingRangeId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addingToDimension, setAddingToDimension] = useState<string | null>(null);
  const [addState, setAddState] = useState<EditState | null>(null);
  const [showFirstRangeForm, setShowFirstRangeForm] = useState(false);
  const [showAddSubscaleForm, setShowAddSubscaleForm] = useState(false);
  const [subscaleFormState, setSubscaleFormState] = useState<AddSubscaleState | null>(null);

  // Derived
  const isLocked = data?.isLocked ?? false;
  const dimensions = data?.dimensions ?? [];

  // ── Edit handlers ──────────────────────────────────────────────────

  const startEdit = useCallback((r: RangeData) => {
    setEditingRangeId(r.id);
    setEditState({
      label: r.label,
      minScore: r.minScore,
      maxScore: r.maxScore,
      description: r.description,
      recommendation: r.recommendation ?? "",
      severity: r.severity,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingRangeId(null);
    setEditState(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingRangeId || !editState) return;
    updateMutation.mutate(
      {
        id: editingRangeId,
        label: editState.label,
        minScore: editState.minScore,
        maxScore: editState.maxScore,
        description: editState.description,
        recommendation: editState.recommendation || null,
        severity: editState.severity as "low" | "moderate" | "high" | "critical",
      },
      {
        onSuccess: () => {
          setSavedId(editingRangeId);
          cancelEdit();
          setTimeout(() => setSavedId(null), SAVE_FLASH_MS);
        },
      }
    );
  }, [editingRangeId, editState, updateMutation, cancelEdit]);

  // ── Add handlers ───────────────────────────────────────────────────

  const startAdd = useCallback((dimName: string) => {
    setAddingToDimension(dimName);
    setAddState({
      label: "",
      minScore: "0.00",
      maxScore: "0.00",
      description: "",
      recommendation: "",
      severity: "low",
    });
  }, []);

  const cancelAdd = useCallback(() => {
    setAddingToDimension(null);
    setAddState(null);
  }, []);

  const confirmAdd = useCallback(
    (dimName: string) => {
      if (!addState) return;
      addMutation.mutate(
        {
          testId,
          dimension: dimName === "__overall__" ? null : dimName,
          label: addState.label,
          minScore: addState.minScore,
          maxScore: addState.maxScore,
          description: addState.description,
          recommendation: addState.recommendation || null,
          severity: addState.severity as "low" | "moderate" | "high" | "critical",
        },
        { onSuccess: () => cancelAdd() }
      );
    },
    [addState, testId, addMutation, cancelAdd]
  );

  // ── Delete handlers ────────────────────────────────────────────────

  const confirmDelete = useCallback(() => {
    if (!deleteConfirmId) return;
    deleteMutation.mutate({ id: deleteConfirmId }, { onSuccess: () => setDeleteConfirmId(null) });
  }, [deleteConfirmId, deleteMutation]);

  // ── Subscale form handlers ─────────────────────────────────────────

  const openSubscaleForm = useCallback((isFirstRange: boolean) => {
    const fresh: AddSubscaleState = {
      subscaleName: "",
      label: "",
      minScore: "0.00",
      maxScore: "0.00",
      description: "",
      recommendation: "",
      severity: "low",
    };
    setSubscaleFormState(fresh);
    if (isFirstRange) {
      setShowFirstRangeForm(true);
      setShowAddSubscaleForm(false);
    } else {
      setShowAddSubscaleForm(true);
      setShowFirstRangeForm(false);
    }
  }, []);

  const closeSubscaleForm = useCallback(() => {
    setShowFirstRangeForm(false);
    setShowAddSubscaleForm(false);
    setSubscaleFormState(null);
  }, []);

  const submitSubscaleForm = useCallback(() => {
    if (!subscaleFormState) return;
    const dimValue = subscaleFormState.subscaleName.trim() || null;
    addMutation.mutate(
      {
        testId,
        dimension: dimValue,
        label: subscaleFormState.label,
        minScore: subscaleFormState.minScore,
        maxScore: subscaleFormState.maxScore,
        description: subscaleFormState.description,
        recommendation: subscaleFormState.recommendation || null,
        severity: subscaleFormState.severity as "low" | "moderate" | "high" | "critical",
      },
      { onSuccess: () => closeSubscaleForm() }
    );
  }, [subscaleFormState, testId, addMutation, closeSubscaleForm]);

  // ── Toggle dimension ───────────────────────────────────────────────

  const toggleDimension = useCallback((name: string) => {
    setExpandedDimension((prev) => (prev === name ? null : name));
  }, []);

  // ── Loading state ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div
          className="admin-shimmer"
          style={{ height: 32, width: 300, margin: "0 auto 16px", borderRadius: 8 }}
        />
        <div
          className="admin-shimmer"
          style={{ height: 20, width: 200, margin: "0 auto 32px", borderRadius: 6 }}
        />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="admin-shimmer"
            style={{ height: 80, borderRadius: 14, marginBottom: 12 }}
          />
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: RED }}>
        <AlertTriangle size={32} style={{ margin: "0 auto 12px", display: "block" }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>
          {error.message ?? "Could not load scale configuration."}
        </p>
      </div>
    );
  }

  // ── Render helpers ─────────────────────────────────────────────────

  const renderSeverityBadge = (severity: string) => {
    const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low!;
    if (!s) return null;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: s.bg,
          color: s.color,
          letterSpacing: "0.02em",
        }}
      >
        {s.label}
      </span>
    );
  };

  const renderEditFields = (
    state: EditState,
    setState: (s: EditState) => void,
    disabled: boolean
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" }}>
      <div>
        <label style={labelStyle}>Range Label</label>
        <input
          style={disabled ? lockedInputStyle : inputStyle}
          value={state.label}
          onChange={(e) => setState({ ...state, label: e.target.value })}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          disabled={disabled}
          placeholder="e.g., Low Stress"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Min Score</label>
          <input
            style={disabled ? lockedInputStyle : inputStyle}
            value={state.minScore}
            onChange={(e) => setState({ ...state, minScore: e.target.value })}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            disabled={disabled}
            placeholder="0.00"
          />
        </div>
        <div>
          <label style={labelStyle}>Max Score</label>
          <input
            style={disabled ? lockedInputStyle : inputStyle}
            value={state.maxScore}
            onChange={(e) => setState({ ...state, maxScore: e.target.value })}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            disabled={disabled}
            placeholder="10.00"
          />
        </div>
        <div>
          <label style={labelStyle}>Severity</label>
          <select
            style={disabled ? lockedInputStyle : inputStyle}
            value={state.severity}
            onChange={(e) => setState({ ...state, severity: e.target.value })}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            disabled={disabled}
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Interpretation</label>
        <textarea
          style={{
            ...(disabled ? lockedInputStyle : inputStyle),
            minHeight: 70,
            resize: "vertical",
          }}
          value={state.description}
          onChange={(e) => setState({ ...state, description: e.target.value })}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          disabled={disabled}
          placeholder="Interpretation text..."
        />
      </div>
      <div>
        <label style={labelStyle}>Recommendation</label>
        <textarea
          style={{
            ...(disabled ? lockedInputStyle : inputStyle),
            minHeight: 50,
            resize: "vertical",
          }}
          value={state.recommendation}
          onChange={(e) => setState({ ...state, recommendation: e.target.value })}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          disabled={disabled}
          placeholder="Actionable recommendation (optional)"
        />
      </div>
    </div>
  );

  // ── Subscale form renderer ─────────────────────────────────────────

  const renderSubscaleForm = (state: AddSubscaleState, isSubmitting: boolean) => (
    <div
      style={{
        background: WHITE,
        borderRadius: 14,
        border: `1.5px solid ${BRAND}`,
        padding: "20px 18px",
        marginTop: 16,
      }}
      className="admin-fade-in"
    >
      <h4
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: BRAND_DEEP,
          margin: "0 0 14px",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        }}
      >
        {showFirstRangeForm ? "Configure First Interpretation Range" : "Add New Subscale"}
      </h4>

      {/* Subscale name */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Subscale Name</label>
        <input
          style={inputStyle}
          value={state.subscaleName}
          onChange={(e) =>
            setSubscaleFormState((prev) =>
              prev ? { ...prev, subscaleName: e.target.value } : prev
            )
          }
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          placeholder="e.g. Overall Score, Anxiety, Resilience..."
        />
        <p
          style={{
            fontSize: 11,
            color: LIGHT_TEXT,
            margin: "4px 0 0",
            fontStyle: "italic",
          }}
        >
          Leave blank for unidimensional assessments
        </p>
      </div>

      {/* Range fields */}
      {renderEditFields(
        state,
        (s) => setSubscaleFormState((prev) => (prev ? { ...prev, ...s } : prev)),
        false
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          className="admin-btn-primary"
          onClick={submitSubscaleForm}
          disabled={isSubmitting || !state.label || !state.description}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          {isSubmitting ? <Loader2 size={12} className="admin-spin" /> : <Plus size={12} />}
          {showFirstRangeForm ? "Create Range" : "Add Subscale"}
        </button>
        <button
          className="admin-btn-ghost"
          onClick={closeSubscaleForm}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          <X size={12} /> Cancel
        </button>
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────

  return (
    <div style={{ padding: "24px 0" }}>
      {/* ── Header with Add Subscale ── */}
      {dimensions.length > 0 && !isLocked && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 12,
          }}
        >
          <button
            className="admin-btn-ghost"
            onClick={() => openSubscaleForm(false)}
            style={{ fontSize: 12, padding: "5px 12px" }}
            disabled={showAddSubscaleForm}
          >
            <Plus size={12} /> Add Subscale
          </button>
        </div>
      )}

      {/* ── Add Subscale Form (header-level) ── */}
      {showAddSubscaleForm && subscaleFormState && (
        <div style={{ marginBottom: 16 }}>
          {renderSubscaleForm(subscaleFormState, addMutation.isPending)}
        </div>
      )}

      {/* ── Lock Banner ── */}
      {isLocked && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 10,
            background: WARNING_BG,
            border: `1px solid ${WARNING_BORDER}`,
            marginBottom: 20,
            fontSize: 13,
            color: WARNING,
            fontWeight: 500,
          }}
          className="admin-fade-in"
        >
          <Lock size={16} />
          <div>
            <strong>Validated Instrument</strong> — Interpretation ranges are locked to the
            canonical scoring reference.
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {dimensions.length === 0 ? (
        <div
          style={{
            border: `2px dashed ${BORDER}`,
            borderRadius: 14,
            padding: "60px 28px",
            textAlign: "center",
          }}
        >
          <BarChart2
            size={48}
            style={{ color: BRAND_LIGHT, margin: "0 auto 16px", display: "block" }}
          />
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: DARK_TEXT,
              margin: "0 0 8px",
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}
          >
            No interpretation ranges configured
          </h3>
          <p
            style={{
              fontSize: 13,
              color: LIGHT_TEXT,
              margin: "0 0 20px",
              maxWidth: 360,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {isLocked
              ? "This validated instrument has no interpretation ranges."
              : "Define how scores are interpreted by adding ranges with labels, thresholds, and recommendations."}
          </p>
          {!isLocked && !showFirstRangeForm && (
            <button
              className="admin-btn-primary"
              onClick={() => openSubscaleForm(true)}
              style={{ fontSize: 13, padding: "8px 20px" }}
            >
              <Plus size={14} /> Configure Interpretation Ranges
            </button>
          )}
          {showFirstRangeForm && subscaleFormState && (
            <div style={{ textAlign: "left", maxWidth: 520, margin: "0 auto" }}>
              {renderSubscaleForm(subscaleFormState, addMutation.isPending)}
            </div>
          )}
        </div>
      ) : (
        /* ── Dimension Accordion Cards ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dimensions.map((dim) => {
            const isExpanded = expandedDimension === dim.name;
            return (
              <div
                key={dim.name}
                style={{
                  background: WHITE,
                  borderRadius: 14,
                  border: `1.5px solid ${isExpanded ? BRAND : BORDER}`,
                  overflow: "hidden",
                  transition: "border-color 0.15s ease",
                }}
                className="admin-fade-in"
              >
                {/* ── Card Header ── */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => toggleDimension(dim.name)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isExpanded ? (
                      <ChevronDown size={16} style={{ color: BRAND_DEEP }} />
                    ) : (
                      <ChevronRight size={16} style={{ color: LIGHT_TEXT }} />
                    )}
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: DARK_TEXT,
                        fontFamily: "'DM Sans', 'Inter', sans-serif",
                      }}
                    >
                      {dim.displayName}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: BRAND_DEEP,
                        background: BRAND_LIGHT,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      {dim.ranges.length} range{dim.ranges.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {!isLocked && (
                    <button
                      className="admin-btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isExpanded) setExpandedDimension(dim.name);
                        startAdd(dim.name);
                      }}
                      style={{ fontSize: 12, padding: "4px 10px" }}
                    >
                      <Plus size={12} /> Add Range
                    </button>
                  )}
                </div>

                {/* ── Expanded Content ── */}
                {isExpanded && (
                  <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${BORDER}` }}>
                    {dim.ranges.map((range) => {
                      const isEditing = editingRangeId === range.id;
                      const isSaved = savedId === range.id;
                      const isDeleting = deleteConfirmId === range.id;

                      return (
                        <div
                          key={range.id}
                          style={{
                            padding: "14px 0",
                            borderBottom: `1px solid ${BORDER}`,
                            position: "relative",
                          }}
                        >
                          {/* Saved flash */}
                          {isSaved && (
                            <div
                              style={{
                                position: "absolute",
                                top: 14,
                                right: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                color: GREEN,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                              className="admin-fade-in"
                            >
                              <Check size={14} /> Saved
                            </div>
                          )}

                          {isEditing && editState ? (
                            /* ── Edit Mode ── */
                            <div>
                              {renderEditFields(editState, (s) => setEditState(s), false)}
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <button
                                  className="admin-btn-primary"
                                  onClick={saveEdit}
                                  disabled={updateMutation.isPending}
                                  style={{ fontSize: 12, padding: "6px 14px" }}
                                >
                                  {updateMutation.isPending ? (
                                    <Loader2 size={12} className="admin-spin" />
                                  ) : (
                                    <Save size={12} />
                                  )}
                                  Save
                                </button>
                                <button
                                  className="admin-btn-ghost"
                                  onClick={cancelEdit}
                                  style={{ fontSize: 12, padding: "6px 14px" }}
                                >
                                  <X size={12} /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : isDeleting ? (
                            /* ── Delete Confirmation ── */
                            <div
                              style={{
                                padding: 14,
                                borderRadius: 10,
                                background: RED_LIGHT,
                                border: `1px solid ${RED_BORDER}`,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 13,
                                  color: RED,
                                  fontWeight: 600,
                                  margin: "0 0 10px",
                                }}
                              >
                                Delete this range? Cannot be undone.
                              </p>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  className="admin-btn-primary"
                                  onClick={confirmDelete}
                                  disabled={deleteMutation.isPending}
                                  style={{
                                    fontSize: 12,
                                    padding: "6px 14px",
                                    background: RED,
                                    borderColor: RED,
                                  }}
                                >
                                  {deleteMutation.isPending ? (
                                    <Loader2 size={12} className="admin-spin" />
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                  Delete
                                </button>
                                <button
                                  className="admin-btn-ghost"
                                  onClick={() => setDeleteConfirmId(null)}
                                  style={{ fontSize: 12, padding: "6px 14px" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ── Read Mode ── */
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  marginBottom: 6,
                                }}
                              >
                                <span style={{ fontSize: 14, fontWeight: 700, color: DARK_TEXT }}>
                                  {range.label}
                                </span>
                                <span style={{ fontSize: 12, color: LIGHT_TEXT }}>
                                  {range.minScore} – {range.maxScore}
                                </span>
                                {renderSeverityBadge(range.severity)}
                              </div>
                              <p
                                style={{
                                  fontSize: 13,
                                  color: MID_TEXT,
                                  margin: "0 0 4px",
                                  lineHeight: 1.5,
                                }}
                              >
                                {range.description}
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: LIGHT_TEXT,
                                  margin: 0,
                                  fontStyle: range.recommendation ? "normal" : "italic",
                                }}
                              >
                                {range.recommendation ?? "No recommendation configured."}
                              </p>
                              {/* Action buttons */}
                              {!isSaved && (
                                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                  <button
                                    className="admin-btn-ghost"
                                    onClick={() => startEdit(range)}
                                    disabled={isLocked}
                                    title={
                                      isLocked ? "Locked — validated instrument" : "Edit range"
                                    }
                                    style={{ fontSize: 11, padding: "4px 10px" }}
                                  >
                                    <Edit3 size={11} /> Edit
                                  </button>
                                  {!isLocked && (
                                    <button
                                      className="admin-btn-ghost"
                                      onClick={() => setDeleteConfirmId(range.id)}
                                      style={{ fontSize: 11, padding: "4px 10px", color: RED }}
                                    >
                                      <Trash2 size={11} /> Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* ── Add Range Form ── */}
                    {addingToDimension === dim.name && addState && (
                      <div style={{ paddingTop: 14 }}>
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: BRAND_DEEP,
                            margin: "0 0 8px",
                          }}
                        >
                          Add New Range
                        </h4>
                        {renderEditFields(addState, (s) => setAddState(s), false)}
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            className="admin-btn-primary"
                            onClick={() => confirmAdd(dim.name)}
                            disabled={
                              addMutation.isPending || !addState.label || !addState.description
                            }
                            style={{ fontSize: 12, padding: "6px 14px" }}
                          >
                            {addMutation.isPending ? (
                              <Loader2 size={12} className="admin-spin" />
                            ) : (
                              <Plus size={12} />
                            )}
                            Add Range
                          </button>
                          <button
                            className="admin-btn-ghost"
                            onClick={cancelAdd}
                            style={{ fontSize: 12, padding: "6px 14px" }}
                          >
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
