"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { DT } from "./types";

/**
 * Unified action button for result rows.
 *
 * Renders a compact button group:  View | ⋮ (overflow menu with Delete).
 * Replaces the ad-hoc action cells previously scattered across tables.
 */

interface ResultActionButtonProps {
  /** UUID of the result row */
  resultId: string;
  /** Optional callback after successful delete */
  onDeleted?: () => void;
  /** Accent color (defaults to DT.TEAL) */
  accentColor?: string;
}

export function ResultActionButton({
  resultId,
  onDeleted,
  accentColor = DT.TEAL,
}: ResultActionButtonProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        gap: 6,
        alignItems: "center",
        justifyContent: "center",
        opacity: isDeleting ? 0.5 : 1,
        pointerEvents: isDeleting ? "none" : "auto",
        transition: "opacity 0.2s ease",
      }}
    >
      {/* View Details */}
      <button
        onClick={handleView}
        title="View Details"
        style={{
          padding: 6,
          borderRadius: 6,
          background: DT.WHITE,
          border: `1px solid ${DT.BORDER}`,
          color: accentColor,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${accentColor}10`;
          e.currentTarget.style.borderColor = `${accentColor}50`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = DT.WHITE;
          e.currentTarget.style.borderColor = DT.BORDER;
        }}
      >
        <Eye size={14} />
      </button>

      {/* Overflow menu */}
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          title="More actions"
          style={{
            padding: 6,
            borderRadius: 6,
            background: menuOpen ? DT.BG_CONTENT : "transparent",
            border: "none",
            color: DT.LIGHT_TEXT,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!menuOpen) e.currentTarget.style.background = DT.BG_CONTENT;
          }}
          onMouseLeave={(e) => {
            if (!menuOpen) e.currentTarget.style.background = "transparent";
          }}
        >
          <MoreVertical size={14} />
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 4,
              background: DT.WHITE,
              border: `1px solid ${DT.BORDER}`,
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 50,
              minWidth: 120,
              padding: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              animation: "adminFadeIn 0.12s ease-out",
            }}
          >
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
                color: DT.RED,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FFF5F5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Trash2 size={12} /> {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
