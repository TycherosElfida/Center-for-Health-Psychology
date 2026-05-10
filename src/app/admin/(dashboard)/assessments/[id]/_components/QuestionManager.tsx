"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Check,
  Loader2,
  AlertTriangle,
  Lock,
  Filter,
  FileText,
} from "lucide-react";
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
  GREEN,
  GREEN_LIGHT,
  GREEN_BORDER,
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

type OptionData = {
  id: string;
  questionId: string;
  order: number;
  label: string;
  value: number;
};

type QuestionData = {
  id: string;
  testId: string;
  order: number;
  questionText: string;
  type: string;
  dimension: string | null;
  isReversed: boolean;
  weight: string;
  required: boolean;
  createdAt: Date;
  options: OptionData[];
};

type EditState = {
  questionText: string;
  dimension: string;
  isReversed: boolean;
  weight: string;
  options: { id?: string; label: string; value: number }[];
};

// ── Constants ────────────────────────────────────────────────────────

const LETTER_BADGES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SAVE_FLASH_MS = 2000;

// ── Component ────────────────────────────────────────────────────────

interface QuestionManagerProps {
  testId: string;
  sessionCount: number;
}

export function QuestionManager({ testId, sessionCount }: QuestionManagerProps) {
  // ── Data fetching ──────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = trpc.adminQuestions.getQuestions.useQuery(
    { testId },
    { enabled: !!testId }
  );

  // ── Mutations ──────────────────────────────────────────────────────
  const createMutation = trpc.adminQuestions.createQuestion.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const updateMutation = trpc.adminQuestions.updateQuestion.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const deleteMutation = trpc.adminQuestions.deleteQuestion.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  // ── Local state ────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dimensionFilter, setDimensionFilter] = useState<string>("all");

  // Derived
  const isLocked = sessionCount > 0;
  const questions = data?.questions ?? [];

  // Unique dimensions for filter
  const dimensions = Array.from(
    new Set(questions.map((q) => q.dimension).filter(Boolean))
  ) as string[];

  // Filtered questions
  const filteredQuestions =
    dimensionFilter === "all"
      ? questions
      : questions.filter((q) => q.dimension === dimensionFilter);

  // ── Edit handlers ──────────────────────────────────────────────────

  const startEdit = useCallback((q: QuestionData) => {
    setEditingId(q.id);
    setEditState({
      questionText: q.questionText,
      dimension: q.dimension ?? "",
      isReversed: q.isReversed,
      weight: q.weight,
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
      })),
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditState(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !editState) return;
    updateMutation.mutate(
      {
        id: editingId,
        questionText: editState.questionText,
        dimension: editState.dimension || null,
        ...(!isLocked && { isReversed: editState.isReversed }),
        ...(!isLocked && { weight: editState.weight }),
        options: editState.options,
      },
      {
        onSuccess: () => {
          setSavedId(editingId);
          cancelEdit();
          setTimeout(() => setSavedId(null), SAVE_FLASH_MS);
        },
      }
    );
  }, [editingId, editState, isLocked, updateMutation, cancelEdit]);

  const handleCreate = useCallback(() => {
    if (isLocked) return;
    createMutation.mutate(
      {
        testId,
        questionText: "New question — click Edit to customize",
        type: "likert_5",
        options: [
          { label: "Strongly Disagree", value: 0 },
          { label: "Disagree", value: 1 },
          { label: "Neutral", value: 2 },
          { label: "Agree", value: 3 },
          { label: "Strongly Agree", value: 4 },
        ],
      },
      {
        onSuccess: (result) => {
          void refetch().then((res) => {
            const newQ = res.data?.questions.find((q) => q.id === result.id);
            if (newQ) startEdit(newQ);
          });
        },
      }
    );
  }, [isLocked, testId, createMutation, refetch, startEdit]);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirmId) return;
    deleteMutation.mutate({ id: deleteConfirmId }, { onSuccess: () => setDeleteConfirmId(null) });
  }, [deleteConfirmId, deleteMutation]);

  // ── Loading / Error states ─────────────────────────────────────────

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
            style={{ height: 120, borderRadius: 14, marginBottom: 16 }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: RED }}>
        <AlertTriangle size={32} style={{ margin: "0 auto 12px", display: "block" }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>
          {error.message ?? "Could not load questions."}
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "24px 0" }}>
      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {dimensions.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Filter size={14} style={{ color: LIGHT_TEXT }} />
              <select
                value={dimensionFilter}
                onChange={(e) => setDimensionFilter(e.target.value)}
                style={{ ...inputStyle, width: "auto", minWidth: 180 }}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
              >
                <option value="all">All dimensions ({questions.length})</option>
                {dimensions.map((d) => (
                  <option key={d} value={d}>
                    {d} ({questions.filter((q) => q.dimension === d).length})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          className="admin-btn-primary"
          onClick={handleCreate}
          disabled={isLocked || createMutation.isPending}
          title={isLocked ? "Cannot add questions while sessions exist" : "Add a new question"}
        >
          {createMutation.isPending ? (
            <Loader2 size={14} className="admin-spin" />
          ) : (
            <Plus size={14} />
          )}
          Add Question
        </button>
      </div>

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
            <strong>Structural Lock Active</strong> — This assessment has{" "}
            <strong>{sessionCount}</strong> session(s). Only question text and option labels can be
            edited.
          </div>
        </div>
      )}

      {/* ── Question Cards ── */}
      {filteredQuestions.length === 0 ? (
        /* Empty state */
        <div
          style={{
            border: `2px dashed ${BORDER}`,
            borderRadius: 14,
            padding: "60px 28px",
            textAlign: "center",
          }}
        >
          <FileText
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
            {dimensionFilter !== "all" ? "No questions in this dimension" : "No questions yet"}
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
              ? "This assessment is locked because it has active sessions."
              : "Add your first question to get started with this assessment."}
          </p>
          {!isLocked && dimensionFilter === "all" && (
            <button
              className="admin-btn-primary"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              <Plus size={14} /> Add First Question
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredQuestions.map((q, idx) => {
            const isEditing = editingId === q.id;
            const isSaved = savedId === q.id;

            return (
              <div
                key={q.id}
                style={{
                  background: WHITE,
                  borderRadius: 14,
                  border: `1.5px solid ${isEditing ? BRAND : BORDER}`,
                  boxShadow: isEditing ? `0 4px 24px ${BRAND}18` : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "16px 20px 12px",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                    {/* Question number badge */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DEEP})`,
                        color: WHITE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      {isEditing ? (
                        <textarea
                          value={editState?.questionText ?? ""}
                          onChange={(e) =>
                            setEditState((s) => (s ? { ...s, questionText: e.target.value } : s))
                          }
                          style={{
                            ...inputStyle,
                            minHeight: 60,
                            resize: "vertical",
                            fontSize: 14,
                          }}
                          onFocus={onInputFocus}
                          onBlur={onInputBlur}
                        />
                      ) : (
                        <p
                          style={{
                            fontSize: 14,
                            color: DARK_TEXT,
                            margin: 0,
                            lineHeight: 1.5,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {q.questionText}
                        </p>
                      )}

                      {/* Dimension + metadata badges */}
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {q.dimension && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: BRAND_BG,
                              color: BRAND_DEEP,
                              border: `1px solid ${BORDER}`,
                            }}
                          >
                            {q.dimension}
                          </span>
                        )}
                        {q.isReversed && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: WARNING_BG,
                              color: WARNING,
                              border: `1px solid ${WARNING_BORDER}`,
                            }}
                          >
                            Reversed
                          </span>
                        )}
                        {q.weight !== "1.00" && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: BRAND_LIGHT,
                              color: BRAND_DEEP,
                            }}
                          >
                            ×{q.weight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {isSaved && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: GREEN,
                          background: GREEN_LIGHT,
                          border: `1px solid ${GREEN_BORDER}`,
                          padding: "4px 10px",
                          borderRadius: 8,
                        }}
                        className="admin-fade-in"
                      >
                        <Check size={12} /> Saved
                      </span>
                    )}
                    {isEditing ? (
                      <>
                        <button className="admin-btn-ghost" onClick={cancelEdit} title="Cancel">
                          <X size={14} />
                        </button>
                        <button
                          className="admin-btn-primary"
                          onClick={saveEdit}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 size={14} className="admin-spin" />
                          ) : (
                            <Save size={14} />
                          )}
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="admin-btn-ghost"
                          onClick={() => startEdit(q)}
                          title="Edit question"
                        >
                          <Edit3 size={14} />
                        </button>
                        {!isLocked && (
                          <button
                            className="admin-btn-ghost"
                            onClick={() => setDeleteConfirmId(q.id)}
                            title="Delete question"
                            style={{ color: RED }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Edit-mode extra fields (dimension, isReversed, weight) */}
                {isEditing && !isLocked && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 12,
                      padding: "0 20px 12px",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Dimension</label>
                      <input
                        value={editState?.dimension ?? ""}
                        onChange={(e) =>
                          setEditState((s) => (s ? { ...s, dimension: e.target.value } : s))
                        }
                        style={inputStyle}
                        placeholder="e.g. Anxiety"
                        onFocus={onInputFocus}
                        onBlur={onInputBlur}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Weight</label>
                      <input
                        value={editState?.weight ?? "1.00"}
                        onChange={(e) =>
                          setEditState((s) => (s ? { ...s, weight: e.target.value } : s))
                        }
                        style={inputStyle}
                        onFocus={onInputFocus}
                        onBlur={onInputBlur}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Reversed</label>
                      <button
                        onClick={() =>
                          setEditState((s) => (s ? { ...s, isReversed: !s.isReversed } : s))
                        }
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          textAlign: "left",
                          background: editState?.isReversed ? WARNING_BG : WHITE,
                          color: editState?.isReversed ? WARNING : MID_TEXT,
                          fontWeight: 600,
                        }}
                      >
                        {editState?.isReversed ? "Yes — Reversed" : "No"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Options section */}
                <div
                  style={{
                    borderTop: `1px solid ${BORDER}`,
                    padding: "12px 20px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ ...labelStyle, marginBottom: 0 }}>Answer Options & Weights</span>
                    {isEditing && !isLocked && (
                      <button
                        className="admin-btn-ghost"
                        style={{ fontSize: 11 }}
                        onClick={() => {
                          setEditState((s) => {
                            if (!s) return s;
                            return {
                              ...s,
                              options: [
                                ...s.options,
                                {
                                  label: `Option ${s.options.length + 1}`,
                                  value: s.options.length,
                                },
                              ],
                            };
                          });
                        }}
                      >
                        <Plus size={12} /> Add Option
                      </button>
                    )}
                  </div>

                  {(isEditing ? (editState?.options ?? []) : q.options).map((opt, oi) => (
                    <div
                      key={isEditing ? oi : (opt as OptionData).id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 0",
                        borderBottom:
                          oi < (isEditing ? (editState?.options.length ?? 0) : q.options.length) - 1
                            ? `1px solid ${BRAND_BG}`
                            : "none",
                      }}
                    >
                      {/* Letter badge */}
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: BRAND_BG,
                          color: BRAND_DEEP,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {LETTER_BADGES[oi] ?? oi + 1}
                      </span>

                      {isEditing ? (
                        <>
                          <input
                            value={opt.label}
                            onChange={(e) => {
                              setEditState((s) => {
                                if (!s) return s;
                                const newOpts = [...s.options];
                                newOpts[oi] = { ...newOpts[oi]!, label: e.target.value };
                                return { ...s, options: newOpts };
                              });
                            }}
                            style={{ ...inputStyle, flex: 1, fontSize: 13 }}
                            onFocus={onInputFocus}
                            onBlur={onInputBlur}
                          />
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 11, color: LIGHT_TEXT, fontWeight: 600 }}>
                              Weight:
                            </span>
                            <input
                              type="number"
                              value={opt.value}
                              onChange={(e) => {
                                setEditState((s) => {
                                  if (!s) return s;
                                  const newOpts = [...s.options];
                                  newOpts[oi] = {
                                    ...newOpts[oi]!,
                                    value: parseInt(e.target.value) || 0,
                                  };
                                  return { ...s, options: newOpts };
                                });
                              }}
                              disabled={isLocked}
                              style={{
                                ...(isLocked ? lockedInputStyle : inputStyle),
                                width: 56,
                                textAlign: "center",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                              onFocus={onInputFocus}
                              onBlur={onInputBlur}
                            />
                          </div>
                          {!isLocked && (editState?.options.length ?? 0) > 2 && (
                            <button
                              className="admin-btn-ghost"
                              onClick={() => {
                                setEditState((s) => {
                                  if (!s) return s;
                                  return { ...s, options: s.options.filter((_, i) => i !== oi) };
                                });
                              }}
                              style={{ color: RED, padding: 4 }}
                              title="Remove option"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1, fontSize: 13, color: MID_TEXT }}>
                            {opt.label}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: BRAND_DEEP,
                              minWidth: 28,
                              textAlign: "center",
                            }}
                          >
                            {opt.value}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirmId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          className="admin-fade-in"
        >
          <div
            style={{
              background: WHITE,
              borderRadius: 16,
              padding: "28px 32px",
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: DARK_TEXT,
                margin: "0 0 8px",
                fontFamily: "'DM Sans', 'Inter', sans-serif",
              }}
            >
              Delete Question?
            </h3>
            <p style={{ fontSize: 13, color: MID_TEXT, margin: "0 0 20px", lineHeight: 1.5 }}>
              This will permanently remove this question and all its answer options. This action
              cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="admin-btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button
                className="admin-btn-danger"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 size={14} className="admin-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
