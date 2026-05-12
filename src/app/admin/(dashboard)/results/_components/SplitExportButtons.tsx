"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileText } from "lucide-react";
import { DT } from "./types";

interface SplitExportButtonsProps {
  testSlug: string;
  totalCount: number;
  filteredCount: number;
  hasAnyFilter: boolean;
  onExportFiltered: (format: "csv" | "xlsx") => void;
  onExportAll: (format: "csv" | "xlsx") => void;
  isExporting: boolean;
}

export function SplitExportButtons({
  totalCount,
  filteredCount,
  hasAnyFilter,
  onExportFiltered,
  onExportAll,
  isExporting,
}: SplitExportButtonsProps) {
  const [openFormatMenu, setOpenFormatMenu] = useState<"filtered" | "all" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenFormatMenu(null);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const renderFormatPicker = (type: "filtered" | "all") => {
    if (openFormatMenu !== type) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          background: DT.WHITE,
          border: `1px solid ${DT.BORDER}`,
          borderRadius: 12,
          boxShadow: "0 8px 30px rgba(0,0,0,0.13)",
          minWidth: 160,
          zIndex: 50,
          padding: "6px 0",
        }}
      >
        <div
          style={{
            padding: "6px 12px",
            fontSize: 10,
            color: DT.LIGHT_TEXT,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Select Format
        </div>

        {/* CSV Option */}
        <button
          onClick={() => {
            if (type === "filtered") onExportFiltered("csv");
            else onExportAll("csv");
            setOpenFormatMenu(null);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            width: "100%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F7F5FC";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: DT.DARK_TEXT,
              }}
            >
              .CSV
            </span>
            <span style={{ fontSize: 11, color: DT.LIGHT_TEXT }}>Comma-separated values</span>
          </div>
        </button>

        {/* XLSX Option */}
        <button
          onClick={() => {
            if (type === "filtered") onExportFiltered("xlsx");
            else onExportAll("xlsx");
            setOpenFormatMenu(null);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            width: "100%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F7F5FC";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: DT.DARK_TEXT,
              }}
            >
              .XLSX
            </span>
            <span style={{ fontSize: 11, color: DT.LIGHT_TEXT }}>Excel Spreadsheet</span>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Download Filtered Button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpenFormatMenu((p) => (p === "filtered" ? null : "filtered"))}
          disabled={isExporting || !hasAnyFilter}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 12,
            background: hasAnyFilter ? `linear-gradient(135deg, ${DT.TEAL}, ${DT.TEAL_DARK})` : DT.BG_ALT,
            border: hasAnyFilter ? "none" : `1px solid ${DT.BORDER}`,
            color: hasAnyFilter ? DT.WHITE : DT.MID_TEXT,
            fontSize: 12,
            fontWeight: 600,
            cursor: isExporting ? "wait" : hasAnyFilter ? "pointer" : "not-allowed",
            boxShadow: hasAnyFilter && !isExporting ? `0 3px 12px ${DT.TEAL}40` : "none",
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap",
            opacity: isExporting ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          <FileText size={13} />
          {isExporting ? "Exporting…" : `Download Filtered (${filteredCount})`}
          <ChevronDown
            size={13}
            style={{
              transform: openFormatMenu === "filtered" ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {renderFormatPicker("filtered")}
      </div>

      {/* Download All Button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpenFormatMenu((p) => (p === "all" ? null : "all"))}
          disabled={isExporting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 12,
            background: DT.WHITE,
            border: `1px solid ${DT.BORDER}`,
            color: DT.DARK_TEXT,
            fontSize: 12,
            fontWeight: 600,
            cursor: isExporting ? "wait" : "pointer",
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap",
            opacity: isExporting ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          <Download size={13} />
          {isExporting ? "Exporting…" : `Download All (${totalCount})`}
          <ChevronDown
            size={13}
            style={{
              transform: openFormatMenu === "all" ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {renderFormatPicker("all")}
      </div>
    </div>
  );
}
