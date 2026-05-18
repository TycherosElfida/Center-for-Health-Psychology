"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, ChevronDown, FileSpreadsheet, FileText, Download, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { BRAND, WHITE, DARK_TEXT, BORDER, RED, RED_LIGHT } from "./DesignTokens";
import { downloadData } from "./exportUtils";

const HOVER_BG = "#FAFAFE";

/**
 * Unified action button for result rows.
 *
 * Renders a compact button group:  [ 👁 View ][ ˅ ]
 * Replaces the ad-hoc action cells previously scattered across tables.
 */

interface ResultActionButtonProps {
  /** UUID of the result row */
  resultId: string;
  /** Slug of the test to export */
  testSlug?: string;
  /** Optional callback after successful delete */
  onDeleted?: () => void;
  /** Accent color (defaults to BRAND) */
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
  const menuRef = useRef<HTMLDivElement>(null);
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

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        opacity: isDeleting || isExporting ? 0.5 : 1,
        pointerEvents: isDeleting || isExporting ? "none" : "auto",
        transition: "opacity 0.2s ease",
        height: 28,
      }}
    >
      {/* View Button */}
      <button
        onClick={handleView}
        title="View Details"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px",
          borderTopLeftRadius: 6,
          borderBottomLeftRadius: 6,
          background: accentColor,
          border: `1px solid ${accentColor}`,
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          transition: "filter 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = "brightness(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "none";
        }}
      >
        <Eye size={14} />
        View
      </button>

      {/* Chevron Dropdown Trigger */}
      <div ref={menuRef} style={{ position: "relative", display: "flex" }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          title="More actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 6px",
            borderTopRightRadius: 6,
            borderBottomRightRadius: 6,
            background: accentColor,
            border: `1px solid ${accentColor}`,
            borderLeft: `1px solid rgba(255,255,255,0.2)`,
            color: "#fff",
            cursor: "pointer",
            transition: "filter 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
        >
          <ChevronDown size={14} />
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 4,
              background: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 50,
              minWidth: 160,
              padding: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              animation: "adminFadeIn 0.12s ease-out",
            }}
          >
            <button
              onClick={() => handleExport("xlsx")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 6,
                background: "transparent",
                border: "none",
                color: DARK_TEXT,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = HOVER_BG;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FileSpreadsheet size={14} style={{ color: "#107C41" }} /> Export as .xlsx
            </button>
            <button
              onClick={() => handleExport("csv")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 6,
                background: "transparent",
                border: "none",
                color: DARK_TEXT,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = HOVER_BG;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FileText size={14} style={{ color: "#0078D4" }} /> Export as .csv
            </button>
            <button
              onClick={handleDownloadPdf}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 6,
                background: "transparent",
                border: "none",
                color: DARK_TEXT,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = HOVER_BG;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Download size={14} style={{ color: RED }} /> Download PDF
            </button>

            <div style={{ height: 1, background: BORDER, margin: "4px 0" }} />

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 6,
                background: "transparent",
                border: "none",
                color: RED,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = RED_LIGHT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Trash2 size={14} /> {isDeleting ? "Deleting..." : "Delete Record"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
