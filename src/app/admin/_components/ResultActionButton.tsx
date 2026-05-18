"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, ChevronDown, FileSpreadsheet, FileText, Download, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { BRAND, WHITE, DARK_TEXT, BORDER, RED, RED_LIGHT } from "./DesignTokens";
import { downloadData } from "./exportUtils";

/* Lavender hover tint matching Figma reference */
const HOVER_TINT = "#F7F5FC";
/* Inner divider between View and chevron — white at ~30% opacity */
const INNER_DIVIDER = "rgba(255, 255, 255, 0.30)";

interface ResultActionButtonProps {
  resultId: string;
  testSlug?: string;
  onDeleted?: () => void;
  accentColor?: string;
}

export function ResultActionButton({
  resultId,
  testSlug,
  onDeleted,
  accentColor = BRAND,
}: ResultActionButtonProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const deleteMutation = trpc.adminResults.deleteResult.useMutation({
    onSuccess: () => {
      setIsDeleting(false);
      setMenuOpen(false);
      if (onDeleted) onDeleted();
      else router.refresh();
    },
    onError: (err) => {
      alert(`Failed to delete result: ${err.message}`);
      setIsDeleting(false);
      setMenuOpen(false);
    },
  });

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleView = () => {
    window.location.href = `/admin/results/${resultId}`;
  };

  const handleDownloadPdf = () => {
    window.open(`/admin/results/${resultId}?print=true`, "_blank");
    setMenuOpen(false);
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    if (!testSlug) {
      alert("Export is not available from this context.");
      return;
    }
    setIsExporting(true);
    setMenuOpen(false);
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
      setMenuOpen(false);
    }
  };

  const busy = isDeleting || isExporting;

  /* Subtle shadow tinted by accent — matches admin-btn-primary spirit */
  const groupShadow = `0 1px 3px ${accentColor}40, 0 1px 2px rgba(0, 0, 0, 0.06)`;

  /* Shared half styles */
  const halfBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: accentColor,
    color: WHITE,
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "filter 0.15s ease",
    fontFamily: "'Inter', sans-serif",
    height: 30,
    boxSizing: "border-box",
  };

  /* Dropdown item shared styles */
  const itemBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    width: "100%",
    background: "transparent",
    border: "none",
    color: DARK_TEXT,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.12s ease",
    whiteSpace: "nowrap",
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
        borderRadius: 8,
        boxShadow: groupShadow,
      }}
    >
      {/* ── View half ── */}
      <button
        type="button"
        onClick={handleView}
        title="View Detailed Report"
        style={{
          ...halfBase,
          gap: 6,
          padding: "0 12px",
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = "brightness(0.92)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "none";
        }}
      >
        <Eye size={14} strokeWidth={2.25} />
        View
      </button>

      {/* ── Chevron half ── */}
      <button
        type="button"
        onClick={() => setMenuOpen((p) => !p)}
        title="More actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        style={{
          ...halfBase,
          width: 32,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          borderLeft: `1px solid ${INNER_DIVIDER}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = "brightness(0.92)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "none";
        }}
      >
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          style={{
            transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {/* ── Dropdown ── */}
      {menuOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            minWidth: 200,
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(107, 92, 160, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)",
            padding: "4px 0",
            animation: "adminFadeIn 0.12s ease-out",
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport("xlsx")}
            style={itemBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = HOVER_TINT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FileSpreadsheet size={15} color="#107C41" strokeWidth={2} />
            <span>Export as .xlsx</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport("csv")}
            style={itemBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = HOVER_TINT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FileText size={15} color="#1565C0" strokeWidth={2} />
            <span>Export as .csv</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadPdf}
            style={itemBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = HOVER_TINT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Download size={15} color="#6B5CA0" strokeWidth={2} />
            <span>Download PDF</span>
          </button>

          <div style={{ height: 1, background: "#F0ECF8", margin: "4px 10px" }} />

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ ...itemBase, color: RED }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = RED_LIGHT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Trash2 size={15} color={RED} strokeWidth={2} />
            <span>{isDeleting ? "Deleting…" : "Delete Record"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
