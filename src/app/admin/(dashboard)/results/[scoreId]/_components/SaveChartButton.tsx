"use client";

import { useRef, useState, useCallback } from "react";
import { Camera } from "lucide-react";
import { toPng } from "html-to-image";
import { DT } from "../../_components/types";

interface SaveChartButtonProps {
  /** Ref to the DOM element to capture */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Filename without extension */
  fileName?: string;
}

export function SaveChartButton({ targetRef, fileName = "chart" }: SaveChartButtonProps) {
  const [busy, setBusy] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleSave = useCallback(async () => {
    if (!targetRef.current || busy) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: "#FFFFFF",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Save as image failed:", e);
    } finally {
      setBusy(false);
    }
  }, [targetRef, fileName, busy]);

  return (
    <div style={{ position: "relative", zIndex: 10 }}>
      <button
        ref={btnRef}
        onClick={handleSave}
        onMouseEnter={() => {
          setShowTooltip(true);
          setHovered(true);
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
          setHovered(false);
        }}
        disabled={busy}
        title="Save as Image"
        aria-label="Save as Image"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 8,
          background: hovered ? DT.TEAL_LIGHT : `${DT.TEAL}08`,
          border: `1.5px solid ${hovered ? `${DT.TEAL}55` : `${DT.TEAL}20`}`,
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.5 : 1,
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <Camera size={14} color={DT.TEAL_DARK} strokeWidth={2.2} />
      </button>

      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: DT.DARK_TEXT,
            color: DT.WHITE,
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            pointerEvents: "none",
          }}
        >
          Save as Image
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `5px solid ${DT.DARK_TEXT}`,
            }}
          />
        </div>
      )}
    </div>
  );
}
