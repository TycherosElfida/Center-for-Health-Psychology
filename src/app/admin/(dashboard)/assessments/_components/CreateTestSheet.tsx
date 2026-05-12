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
import { CreatableSelect } from "../../../_components/CreatableSelect";

import {
  DARK_TEXT,
  LIGHT_TEXT,
  BORDER,
  RED,
  GREEN,
  GREEN_LIGHT,
  GREEN_BORDER,
  inputStyle as sharedInputStyle,
  labelStyle as sharedLabelStyle,
  onInputFocus,
  onInputBlur,
} from "../../../_components/DesignTokens";

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
  abbreviation: string;
  slug: string;
  description: string;
  category: string;
  scoringMethod: "summative" | "dimensional" | "binary_cluster";
  instructions: string;
  thumbnailUrl: string;
}

const INITIAL_FORM: FormState = {
  title: "",
  abbreviation: "",
  slug: "",
  description: "",
  category: "",
  scoringMethod: "summative",
  instructions: "",
  thumbnailUrl: "",
};

export function CreateTestSheet({ open, onOpenChange, onCreated }: CreateTestSheetProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = trpc.adminTests.getCategories.useQuery({});
  const categories = categoriesQuery.data ?? [];

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

    createMutation.mutate({
      title: form.title,
      abbreviation: form.abbreviation,
      slug: form.slug,
      description: form.description || "",
      category: form.category,
      scoringMethod: form.scoringMethod,
      // Empty string coercion — prevent sending "" as valid URL
      instructions: form.instructions || "",
      thumbnailUrl: form.thumbnailUrl || "",
    });
  }

  /* ── Derived styles ── */
  const lblStyle: React.CSSProperties = {
    ...sharedLabelStyle,
    display: "block",
    textTransform: "none",
    fontSize: 12,
    letterSpacing: "normal",
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
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <SheetTitle
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: DARK_TEXT,
              letterSpacing: "-0.01em",
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}
          >
            New Assessment
          </SheetTitle>
          <SheetDescription style={{ fontSize: 13, color: LIGHT_TEXT }}>
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
            <label style={lblStyle}>
              Title <span style={{ color: RED }}>*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Perceived Stress Scale"
              style={sharedInputStyle}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
            />
          </div>

          {/* Abbreviation */}
          <div>
            <label style={lblStyle}>
              Abbreviation <span style={{ color: RED }}>*</span>
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={form.abbreviation}
              onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value }))}
              placeholder="e.g. PSS-10"
              style={sharedInputStyle}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
            />
          </div>

          {/* Slug */}
          <div>
            <label style={lblStyle}>
              Slug <span style={{ color: RED }}>*</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 400,
                  color: LIGHT_TEXT,
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
                ...sharedInputStyle,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 12,
              }}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
            />
          </div>

          {/* Category */}
          <div>
            <label style={lblStyle}>
              Category <span style={{ color: RED }}>*</span>
            </label>
            <CreatableSelect
              value={form.category}
              onChange={(val) => setForm((f) => ({ ...f, category: val }))}
              options={categories}
              placeholder="Select or type to create a new category..."
            />
          </div>

          {/* Scoring Method */}
          <div>
            <label style={lblStyle}>
              Scoring Method <span style={{ color: RED }}>*</span>
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
            <label style={lblStyle}>Description</label>
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the assessment..."
              rows={3}
              style={{
                ...sharedInputStyle,
                resize: "vertical",
                minHeight: 72,
              }}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
            />
          </div>

          {/* Instructions */}
          <div>
            <label style={lblStyle}>Instructions</label>
            <textarea
              maxLength={5000}
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              placeholder="Instructions shown to participants before starting..."
              rows={3}
              style={{
                ...sharedInputStyle,
                resize: "vertical",
                minHeight: 72,
              }}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
            />
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
                color: RED,
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
                background: GREEN_LIGHT,
                border: `1px solid ${GREEN_BORDER}`,
                fontSize: 12,
                color: GREEN,
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
              borderTop: `1px solid ${BORDER}`,
              display: "flex",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="admin-btn-secondary"
              style={{ flex: 1, justifyContent: "center", fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="admin-btn-primary"
              style={{
                flex: 1,
                justifyContent: "center",
                opacity: createMutation.isPending ? 0.6 : 1,
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
