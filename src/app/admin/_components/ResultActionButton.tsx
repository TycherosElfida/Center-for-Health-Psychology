"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Eye,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Trash2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import {
  WHITE,
  DARK_TEXT,
  LIGHT_TEXT,
  BORDER,
  BRAND_DEEP,
  BRAND_LIGHT,
  BRAND_BG,
  GREEN,
  RED,
  RED_LIGHT,
} from "./DesignTokens";
import { downloadData } from "./exportUtils";

const XLSX_ICON = "#107C41";
const CSV_ICON = "#1565C0";

function darken(hex: string, factor: number) {
  const h = hex.replace("#", "");
  if (h.length < 6) return hex;
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - factor)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - factor)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - factor)));
  return `rgb(${r},${g},${b})`;
}

interface ResultActionButtonProps {
  resultId: string;
  testSlug?: string;
  onDeleted?: () => void;
  color: { bg: string; text: string };
}

export function ResultActionButton({
  resultId,
  testSlug,
  onDeleted,
  color,
}: ResultActionButtonProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const subTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utils = trpc.useUtils();

  const deleteMutation = trpc.adminResults.deleteResult.useMutation({
    onSuccess: () => {
      setIsDeleting(false);
      setOpen(false);
      if (onDeleted) onDeleted();
      else router.refresh();
    },
    onError: (err) => {
      alert(`Failed to delete result: ${err.message}`);
      setIsDeleting(false);
      setOpen(false);
    },
  });

  /* Close on outside click — checks both the trigger and the fixed dropdown */
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
        setSubOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* Close when any scroll ancestor scrolls (capture phase catches table scroll) */
  useEffect(() => {
    if (!open) return;
    function handleScroll(e: Event) {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setSubOpen(false);
    }
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  function close() {
    setOpen(false);
    setSubOpen(false);
  }

  const handleChevronClick = () => {
    if (!open && chevronRef.current) {
      const rect = chevronRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((p) => !p);
    setSubOpen(false);
  };

  /* Safe-triangle-style delay for sub-menu */
  const enterDownload = useCallback(() => {
    if (subTimer.current) clearTimeout(subTimer.current);
    setSubOpen(true);
  }, []);
  const leaveDownload = useCallback(() => {
    subTimer.current = setTimeout(() => setSubOpen(false), 180);
  }, []);
  const enterSub = useCallback(() => {
    if (subTimer.current) clearTimeout(subTimer.current);
  }, []);
  const leaveSub = useCallback(() => {
    subTimer.current = setTimeout(() => setSubOpen(false), 120);
  }, []);

  const handleView = () => {
    window.location.href = `/admin/results/${resultId}`;
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    close();
    try {
      const res = await fetch(`/api/admin/report-pdf?scoreId=${resultId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${testSlug ?? "assessment"}-${resultId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    if (!testSlug) {
      alert("Export is not available from this context.");
      return;
    }
    setIsExporting(true);
    close();
    try {
      const data = await utils.client.adminResults.export.query({
        testSlug: testSlug,
        scoreId: resultId,
      });
      downloadData(
        data.rows as unknown as Array<Record<string, unknown>>,
        data.questionHeaders ?? [],
        `${testSlug}-result-${resultId.split("-")[0]}`,
        format
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Export failed: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = () => {
    const ok = window.confirm(
      "Are you sure you want to delete this result? This action cannot be undone."
    );
    if (ok) {
      setIsDeleting(true);
      deleteMutation.mutate({ scoreId: resultId });
    } else {
      close();
    }
  };

  const busy = isDeleting || isExporting;
  const hoverBg = darken(color.bg, 0.06);
  const borderMid = `${color.text}25`;

  const menuItemBase: React.CSSProperties = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    color: DARK_TEXT,
    width: "calc(100% - 8px)",
    margin: "0 4px",
    textAlign: "left",
    padding: "9px 10px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    gap: 10,
    whiteSpace: "nowrap",
    transition: "background 0.12s",
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        display: "inline-flex",
        opacity: busy ? 0.55 : 1,
        pointerEvents: busy ? "none" : "auto",
        transition: "opacity 0.2s ease",
      }}
    >
      {/* ── Primary: View ── */}
      <button
        type="button"
        onClick={handleView}
        title="View Detailed Report"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          background: color.bg,
          color: color.text,
          fontSize: 11,
          fontWeight: 600,
          border: `1px solid ${borderMid}`,
          borderRight: "none",
          cursor: "pointer",
          transition: "background 0.12s",
          fontFamily: "'Inter', sans-serif",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = color.bg;
        }}
      >
        <Eye size={12} strokeWidth={2.25} />
        View
      </button>

      {/* ── Chevron trigger ── */}
      <button
        ref={chevronRef}
        type="button"
        onClick={handleChevronClick}
        aria-haspopup="menu"
        aria-expanded={open}
        title="More actions"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px",
          minWidth: 26,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          background: color.bg,
          color: color.text,
          border: `1px solid ${borderMid}`,
          borderLeft: `1px solid ${borderMid}`,
          cursor: "pointer",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = color.bg;
        }}
      >
        <ChevronDown
          size={12}
          strokeWidth={2.25}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {/* ── Dropdown (portaled to escape table stacking context and transforms) ── */}
      {open &&
        dropdownPos &&
        mounted &&
        createPortal(
          <div
            ref={dropdownRef}
            role="menu"
            style={{
              position: "fixed",
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 9999,
              minWidth: 200,
              background: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              boxShadow: "0 12px 36px rgba(107, 92, 160, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)",
              padding: "4px 0",
              animation: "adminFadeIn 0.12s ease-out",
            }}
          >
            {/* Download Result — hover to expand sub-menu */}
            <div
              style={{ position: "relative" }}
              onMouseEnter={enterDownload}
              onMouseLeave={leaveDownload}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  if (subTimer.current) clearTimeout(subTimer.current);
                  setSubOpen((p) => !p);
                }}
                style={{
                  ...menuItemBase,
                  background: subOpen ? BRAND_BG : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = BRAND_BG;
                }}
                onMouseLeave={(e) => {
                  if (!subOpen) e.currentTarget.style.background = "transparent";
                }}
              >
                <Download size={14} color={BRAND_DEEP} strokeWidth={2} />
                <span style={{ flex: 1 }}>Download Result</span>
                <ChevronRight size={12} color={LIGHT_TEXT} />
              </button>

              {/* ── Nested sub-menu (flyout left) ── */}
              {subOpen && (
                <div
                  onMouseEnter={enterSub}
                  onMouseLeave={leaveSub}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: "calc(100% + 6px)",
                    minWidth: 170,
                    background: WHITE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    boxShadow: "0 8px 30px rgba(107,92,160,0.14), 0 2px 8px rgba(0,0,0,0.06)",
                    padding: "4px 0",
                    zIndex: 10000,
                    animation: "adminFadeIn 0.12s ease-out",
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport("xlsx")}
                    style={menuItemBase}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = BRAND_BG;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FileSpreadsheet size={13} color={XLSX_ICON} strokeWidth={2} />
                    <span>Export as .xlsx</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport("csv")}
                    style={menuItemBase}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = BRAND_BG;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FileText size={13} color={CSV_ICON} strokeWidth={2} />
                    <span>Export as .csv</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDownloadPdf}
                    style={menuItemBase}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = BRAND_BG;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Download size={13} color={GREEN} strokeWidth={2} />
                    <span>Download PDF</span>
                  </button>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: BRAND_LIGHT, margin: "4px 10px" }} />

            {/* Delete */}
            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ ...menuItemBase, color: RED }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = RED_LIGHT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Trash2 size={14} color={RED} strokeWidth={2} />
              <span>{isDeleting ? "Deleting…" : "Delete Record"}</span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
