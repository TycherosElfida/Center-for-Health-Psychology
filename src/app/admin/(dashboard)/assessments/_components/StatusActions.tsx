/**
 * StatusActions — Contextual action buttons for assessment rows.
 *
 * Renders the appropriate lifecycle action based on current test status:
 * - Draft:     [Publish] [Delete]
 * - Published: [Archive]
 * - Archived:  [Revert to Draft]
 *
 * Each action displays a confirmation dialog before executing.
 * Uses window.confirm for simplicity — can be upgraded to modal later.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { MoreHorizontal, Send, Archive, RotateCcw, Trash2, Loader2 } from "lucide-react";

import {
  DARK_TEXT,
  MID_TEXT,
  LIGHT_TEXT,
  BORDER,
  WHITE,
  BRAND,
  RED,
  GREEN,
  WARNING,
  RED_LIGHT,
} from "../../../_components/DesignTokens";

/* ── Types ───────────────────────────────────────────────────── */
interface TestRow {
  id: string;
  title: string;
  status: string;
  sessionCount: number;
  questionCount: number;
}

interface StatusActionsProps {
  test: TestRow;
  onRefresh: () => void;
}

export function StatusActions({ test, onRefresh }: StatusActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const publishMutation = trpc.adminTests.publishTest.useMutation({
    onSuccess: () => {
      setMenuOpen(false);
      onRefresh();
    },
  });

  const archiveMutation = trpc.adminTests.archiveTest.useMutation({
    onSuccess: () => {
      setMenuOpen(false);
      onRefresh();
    },
  });

  const revertMutation = trpc.adminTests.revertToDraft.useMutation({
    onSuccess: () => {
      setMenuOpen(false);
      onRefresh();
    },
  });

  const deleteMutation = trpc.adminTests.deleteTest.useMutation({
    onSuccess: () => {
      setMenuOpen(false);
      onRefresh();
    },
  });

  const isAnyPending =
    publishMutation.isPending ||
    archiveMutation.isPending ||
    revertMutation.isPending ||
    deleteMutation.isPending;

  const errorMessage =
    publishMutation.error?.message ||
    archiveMutation.error?.message ||
    revertMutation.error?.message ||
    deleteMutation.error?.message;

  function handlePublish() {
    if (test.questionCount < 1) {
      alert("Cannot publish: this assessment has no questions.");
      return;
    }
    if (confirm(`Publish "${test.title}"? It will become available to participants.`)) {
      publishMutation.mutate({ id: test.id });
    }
  }

  function handleArchive() {
    if (confirm(`Archive "${test.title}"? It will no longer be available to new participants.`)) {
      archiveMutation.mutate({ id: test.id });
    }
  }

  function handleRevert() {
    if (confirm(`Revert "${test.title}" to draft? It can be edited and re-published.`)) {
      revertMutation.mutate({ id: test.id });
    }
  }

  function handleDelete() {
    if (test.sessionCount > 0) {
      alert(`Cannot delete: ${test.sessionCount} session(s) exist. Archive it instead.`);
      return;
    }
    if (confirm(`Permanently delete "${test.title}"? This action cannot be undone.`)) {
      deleteMutation.mutate({ id: test.id });
    }
  }

  /* ── Menu item style builder ── */
  const menuItemStyle = (color: string = MID_TEXT): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 14px",
    border: "none",
    background: "none",
    fontSize: 12,
    fontWeight: 500,
    color,
    cursor: "pointer",
    transition: "background 0.1s ease",
    textAlign: "left" as const,
    fontFamily: "'Inter', sans-serif",
  });

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => {
          if (!menuOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setDropUp(spaceBelow < 220);
          }
          setMenuOpen(!menuOpen);
        }}
        disabled={isAnyPending}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
          background: WHITE,
          color: LIGHT_TEXT,
          cursor: isAnyPending ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          marginLeft: "auto",
        }}
      >
        {isAnyPending ? <Loader2 size={14} className="admin-spin" /> : <MoreHorizontal size={14} />}
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            ...(dropUp ? { bottom: "100%", marginBottom: 4 } : { top: "100%", marginTop: 4 }),
            width: 200,
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            boxShadow: dropUp
              ? "0 -8px 24px rgba(30, 24, 48, 0.12)"
              : "0 8px 24px rgba(30, 24, 48, 0.12)",
            zIndex: 50,
            overflow: "hidden",
            animation: "adminFadeIn 0.15s ease-out",
          }}
        >
          {/* Status-dependent actions */}
          {test.status === "draft" && (
            <>
              <button
                onClick={handlePublish}
                style={menuItemStyle(GREEN)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E8F5E9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <Send size={14} />
                Publish
                {test.questionCount < 1 && (
                  <span
                    style={{
                      fontSize: 9,
                      color: WARNING,
                      marginLeft: "auto",
                      fontWeight: 600,
                    }}
                  >
                    No Q&apos;s
                  </span>
                )}
              </button>

              {/* Archive — shown for drafts with sessions (delete is blocked) */}
              {test.sessionCount > 0 && (
                <button
                  onClick={handleArchive}
                  style={menuItemStyle(WARNING)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FFF3E0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                  }}
                >
                  <Archive size={14} />
                  Archive
                </button>
              )}

              {/* Delete — only when no sessions exist */}
              {test.sessionCount === 0 && (
                <>
                  <div style={{ height: 1, background: BORDER, margin: "2px 0" }} />
                  <button
                    onClick={handleDelete}
                    style={menuItemStyle(RED)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = RED_LIGHT;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              )}
            </>
          )}

          {test.status === "published" && (
            <button
              onClick={handleArchive}
              style={menuItemStyle(WARNING)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FFF3E0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <Archive size={14} />
              Archive
            </button>
          )}

          {test.status === "archived" && (
            <>
              <button
                onClick={handlePublish}
                style={menuItemStyle(GREEN)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E8F5E9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <Send size={14} />
                Republish
              </button>
              <button
                onClick={handleRevert}
                style={menuItemStyle(MID_TEXT)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${BRAND}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <RotateCcw size={14} />
                Revert to Draft
              </button>
            </>
          )}

          {/* Edit link — always available */}
          <div style={{ height: 1, background: BORDER, margin: "2px 0" }} />
          <button
            onClick={() => {
              setMenuOpen(false);
              window.location.href = `/admin/assessments/${test.id}`;
            }}
            style={menuItemStyle(DARK_TEXT)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${BRAND}08`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            Edit Details
          </button>
        </div>
      )}

      {/* Error toast — inline for now */}
      {errorMessage && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            padding: "8px 12px",
            borderRadius: 8,
            background: "#FFF5F5",
            border: "1px solid #FFCDD2",
            fontSize: 11,
            color: RED,
            whiteSpace: "nowrap",
            zIndex: 51,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
