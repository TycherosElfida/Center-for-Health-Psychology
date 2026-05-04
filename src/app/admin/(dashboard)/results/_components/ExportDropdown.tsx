"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileText } from "lucide-react";
import { DT } from "./types";

interface ExportDropdownProps {
  testSlug: string;
  totalCount: number;
  filteredCount: number;
  hasAnyFilter: boolean;
  onExportFiltered: () => void;
  onExportAll: () => void;
  isExporting: boolean;
}

export function ExportDropdown({
  totalCount,
  filteredCount,
  hasAnyFilter,
  onExportFiltered,
  onExportAll,
  isExporting,
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={isExporting}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          borderRadius: 12,
          background: `linear-gradient(135deg, ${DT.TEAL}, ${DT.TEAL_DARK})`,
          border: "none",
          color: DT.WHITE,
          fontSize: 12,
          fontWeight: 600,
          cursor: isExporting ? "wait" : "pointer",
          boxShadow: `0 3px 12px ${DT.TEAL}40`,
          fontFamily: "'Inter', sans-serif",
          whiteSpace: "nowrap",
          opacity: isExporting ? 0.7 : 1,
          transition: "all 0.2s",
        }}
      >
        <Download size={13} />
        {isExporting ? "Exporting…" : "Export CSV"}
        <ChevronDown
          size={13}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {open && !isExporting && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: DT.WHITE,
            border: `1px solid ${DT.BORDER}`,
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.13)",
            minWidth: 220,
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
            Export Options
          </div>

          {/* Download Filtered */}
          <button
            onClick={() => {
              onExportFiltered();
              setOpen(false);
            }}
            disabled={!hasAnyFilter}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              width: "100%",
              background: "transparent",
              border: "none",
              cursor: hasAnyFilter ? "pointer" : "not-allowed",
              textAlign: "left",
              opacity: hasAnyFilter ? 1 : 0.5,
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => {
              if (hasAnyFilter) e.currentTarget.style.background = "#F7F5FC";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${DT.TEAL}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileText size={15} color={DT.TEAL_DARK} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: DT.DARK_TEXT,
                }}
              >
                Download Filtered ({filteredCount})
              </span>
              <span style={{ fontSize: 10, color: DT.LIGHT_TEXT }}>
                Current filter results as CSV
              </span>
            </div>
          </button>

          {/* Download All */}
          <button
            onClick={() => {
              onExportAll();
              setOpen(false);
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
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#E8F5E9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Download size={15} color="#2E7D32" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: DT.DARK_TEXT,
                }}
              >
                Download All ({totalCount})
              </span>
              <span style={{ fontSize: 10, color: DT.LIGHT_TEXT }}>All records for this test</span>
            </div>
          </button>

          <div
            style={{
              height: 1,
              background: DT.BORDER,
              margin: "4px 12px",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 10,
              color: DT.LIGHT_TEXT,
              fontWeight: 500,
            }}
          >
            <Download size={10} /> Max 5,000 records per export
          </div>
        </div>
      )}
    </div>
  );
}
