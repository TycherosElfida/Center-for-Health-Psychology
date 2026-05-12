"use client";

import { X, UploadCloud, AlertCircle } from "lucide-react";
import { DT } from "./types";

interface ImportModalProps {
  onClose: () => void;
  shortName: string;
}

export function ImportModal({ onClose, shortName }: ImportModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: DT.WHITE,
          borderRadius: 20,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${DT.BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F9F8FD",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: DT.DARK_TEXT }}>
            Import {shortName} Data
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: DT.LIGHT_TEXT,
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Drag & Drop Zone */}
          <div
            style={{
              border: `2px dashed ${DT.TEAL}50`,
              borderRadius: 12,
              padding: "40px 20px",
              textAlign: "center",
              background: `${DT.TEAL}05`,
              cursor: "not-allowed",
              marginBottom: 20,
            }}
          >
            <UploadCloud size={40} color={DT.TEAL} style={{ marginBottom: 12, opacity: 0.8 }} />
            <p style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 600, color: DT.DARK_TEXT }}>
              Click to browse or drag a file here
            </p>
            <p style={{ margin: 0, fontSize: 12, color: DT.LIGHT_TEXT }}>
              Must be a .csv or .xlsx file (Max 5MB)
            </p>
          </div>

          {/* Required Columns Info */}
          <div
            style={{
              background: DT.BG_ALT,
              borderRadius: 12,
              padding: "16px",
              marginBottom: 24,
              border: `1px solid ${DT.BORDER}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <AlertCircle size={16} color={DT.MID_TEXT} />
              <span style={{ fontSize: 13, fontWeight: 600, color: DT.DARK_TEXT }}>
                Required Columns
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: DT.MID_TEXT, lineHeight: 1.5 }}>
              Your file must include exactly: <code style={{ background: DT.WHITE, padding: "2px 6px", borderRadius: 4, border: `1px solid ${DT.BORDER}`, fontSize: 11 }}>Name</code>,{" "}
              <code style={{ background: DT.WHITE, padding: "2px 6px", borderRadius: 4, border: `1px solid ${DT.BORDER}`, fontSize: 11 }}>Sex</code>,{" "}
              <code style={{ background: DT.WHITE, padding: "2px 6px", borderRadius: 4, border: `1px solid ${DT.BORDER}`, fontSize: 11 }}>Age</code>, and{" "}
              <code style={{ background: DT.WHITE, padding: "2px 6px", borderRadius: 4, border: `1px solid ${DT.BORDER}`, fontSize: 11 }}>Score</code>.
              Additional columns like <code style={{ background: DT.WHITE, padding: "2px 6px", borderRadius: 4, border: `1px solid ${DT.BORDER}`, fontSize: 11 }}>City</code> and <code style={{ background: DT.WHITE, padding: "2px 6px", borderRadius: 4, border: `1px solid ${DT.BORDER}`, fontSize: 11 }}>Province</code> are optional.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 16 }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                background: DT.WHITE,
                border: `1px solid ${DT.BORDER}`,
                color: DT.DARK_TEXT,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              disabled
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: DT.TEAL,
                border: "none",
                color: DT.WHITE,
                fontSize: 13,
                fontWeight: 600,
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              Upload Data
            </button>
          </div>
          
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: DT.LIGHT_TEXT,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Bulk import is planned for a future release.
          </p>
        </div>
      </div>
    </div>
  );
}
