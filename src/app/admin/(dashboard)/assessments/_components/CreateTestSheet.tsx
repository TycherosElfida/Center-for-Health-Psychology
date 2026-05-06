/**
 * CreateTestSheet — Slide-in sheet for creating new assessment instruments.
 *
 * Design decision: Sheet (not full page) because the create form is a
 * bounded 7-field interaction. Admin stays on the list page.
 * Opens via ?mode=create or programmatically.
 *
 * Reviewed fixes applied:
 * - Empty string coercion: thumbnailUrl/instructions → || undefined before submit
 * - router.refresh() NOT used — onCreated callback triggers refetch
 */
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";

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
} as const;

/* ── Slug generator ──────────────────────────────────────────── */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ── Types ───────────────────────────────────────────────────── */
interface CreateTestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  category: string;
  estimatedMinutes: string;
  scoringMethod: "summative" | "dimensional" | "binary_cluster";
  instructions: string;
  thumbnailUrl: string;
}

const INITIAL_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  category: "",
  estimatedMinutes: "",
  scoringMethod: "summative",
  instructions: "",
  thumbnailUrl: "",
};

export function CreateTestSheet({ open, onOpenChange, onCreated }: CreateTestSheetProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.adminTests.createTest.useMutation({
    onSuccess: () => {
      setForm(INITIAL_FORM);
      setSlugManual(false);
      setError(null);
      onCreated();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugManual ? f.slug : toSlug(title),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const minutes = parseInt(form.estimatedMinutes, 10);
    if (isNaN(minutes) || minutes < 1) {
      setError("Estimated minutes must be at least 1.");
      return;
    }

    createMutation.mutate({
      title: form.title,
      slug: form.slug,
      description: form.description || "",
      category: form.category,
      estimatedMinutes: minutes,
      scoringMethod: form.scoringMethod,
      // Empty string coercion — prevent sending "" as valid URL
      instructions: form.instructions || "",
      thumbnailUrl: form.thumbnailUrl || "",
    });
  }

  /* ── Inline style helpers ──────────────────────────────────── */
  const labelStyle: React.CSSProperties = {
    display: "block",
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B7CB8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 32,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{
          width: 480,
          maxWidth: "100vw",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <SheetHeader
          style={{
            padding: "24px 28px 16px",
            borderBottom: `1px solid ${DT.BORDER}`,
          }}
        >
          <SheetTitle
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: DT.DARK_TEXT,
              letterSpacing: "-0.01em",
            }}
          >
            New Assessment
          </SheetTitle>
          <SheetDescription style={{ fontSize: 13, color: DT.LIGHT_TEXT }}>
            Create a new assessment instrument. It will start as a Draft.
          </SheetDescription>
        </SheetHeader>

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Title */}
          <div>
            <label style={labelStyle}>
              Title <span style={{ color: DT.ERROR }}>*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Perceived Stress Scale"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
          </div>

          {/* Slug */}
          <div>
            <label style={labelStyle}>
              Slug <span style={{ color: DT.ERROR }}>*</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 400,
                  color: DT.LIGHT_TEXT,
                  marginLeft: 8,
                }}
              >
                {slugManual ? "Manual editing" : "Auto-generated from title"}
              </span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                setForm((f) => ({ ...f, slug: toSlug(e.target.value) }));
              }}
              placeholder="e.g. pss-10"
              style={{
                ...inputStyle,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 12,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
          </div>

          {/* Category + Estimated Minutes (side-by-side) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
            <div>
              <label style={labelStyle}>
                Category <span style={{ color: DT.ERROR }}>*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Stress"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = DT.BRAND;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = DT.BORDER;
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Minutes <span style={{ color: DT.ERROR }}>*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={form.estimatedMinutes}
                onChange={(e) => setForm((f) => ({ ...f, estimatedMinutes: e.target.value }))}
                placeholder="10"
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

          {/* Scoring Method */}
          <div>
            <label style={labelStyle}>
              Scoring Method <span style={{ color: DT.ERROR }}>*</span>
            </label>
            <select
              required
              value={form.scoringMethod}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  scoringMethod: e.target.value as FormState["scoringMethod"],
                }))
              }
              style={selectStyle}
            >
              <option value="summative">Summative</option>
              <option value="dimensional">Dimensional</option>
              <option value="binary_cluster">Binary Cluster</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the assessment..."
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 72,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
          </div>

          {/* Instructions */}
          <div>
            <label style={labelStyle}>Instructions</label>
            <textarea
              maxLength={5000}
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              placeholder="Instructions shown to participants before starting..."
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 72,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DT.BRAND;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = DT.BORDER;
              }}
            />
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

          {/* Error */}
          {error && (
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
              }}
            >
              <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Success state (brief flash) */}
          {createMutation.isSuccess && (
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
                color: "#2E7D32",
              }}
            >
              <CheckCircle size={14} />
              Assessment created.
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Submit */}
          <div
            style={{
              padding: "16px 0 4px",
              borderTop: `1px solid ${DT.BORDER}`,
              display: "flex",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 8,
                border: `1.5px solid ${DT.BORDER}`,
                background: DT.WHITE,
                color: DT.MID_TEXT,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: `linear-gradient(135deg, ${DT.BRAND}, ${DT.BRAND_DEEP})`,
                color: DT.WHITE,
                fontSize: 13,
                fontWeight: 600,
                cursor: createMutation.isPending ? "not-allowed" : "pointer",
                opacity: createMutation.isPending ? 0.6 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={14} className="admin-spin" />
                  Creating...
                </>
              ) : (
                "Create Assessment"
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
