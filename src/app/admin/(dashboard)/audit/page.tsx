"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  BRAND,
  BRAND_DEEP,
  BRAND_LIGHT,
  BRAND_BG,
  WHITE,
  DARK_TEXT,
  MID_TEXT,
  LIGHT_TEXT,
  BORDER,
  RED,
  RED_LIGHT,
  RED_BORDER,
  GREEN,
  GREEN_LIGHT,
  GREEN_BORDER,
  WARNING,
  WARNING_BG,
  WARNING_BORDER,
  inputStyle,
  onInputFocus,
  onInputBlur,
} from "../../_components/DesignTokens";

/* ── Domain color mapping ──────────────────────────────────────── */

type Domain = "test" | "account" | "auth" | "report" | "system";

const DOMAIN_COLORS: Record<Domain, { bg: string; color: string; border: string }> = {
  test: { bg: BRAND_LIGHT, color: BRAND_DEEP, border: BRAND },
  account: { bg: WARNING_BG, color: WARNING, border: WARNING_BORDER },
  auth: { bg: RED_LIGHT, color: RED, border: RED_BORDER },
  report: { bg: GREEN_LIGHT, color: GREEN, border: GREEN_BORDER },
  system: { bg: "#F5F5F5", color: LIGHT_TEXT, border: "#E0E0E0" },
};

function domainOf(action: string): Domain {
  if (action.startsWith("test.") || action.startsWith("question.")) return "test";
  if (action.startsWith("account.") || action.startsWith("user.")) return "account";
  if (action.startsWith("auth.")) return "auth";
  if (action.startsWith("report.")) return "report";
  return "system";
}

/* ── Helpers ───────────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function exportCSV(entries: Array<Record<string, unknown>>) {
  const cols = [
    "createdAt",
    "actorName",
    "actorEmail",
    "action",
    "entityType",
    "entityId",
    "entityLabel",
    "oldValue",
    "newValue",
    "ipHash",
  ];
  const header = cols.join(",");
  const rows = entries.map((e) =>
    cols
      .map((c) => {
        const v = e[c];
        const s = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
        return `"${s.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `chp-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

/* ── Quick filter type ─────────────────────────────────────────── */

type QuickFilter = "24h" | "week" | "security" | "mine" | undefined;

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "24h", label: "Last 24h" },
  { key: "week", label: "This Week" },
  { key: "security", label: "Security Events" },
  { key: "mine", label: "My Activity" },
];

/* ── DiffBlock ─────────────────────────────────────────────────── */

function DiffBlock({ oldValue, newValue }: { oldValue: unknown; newValue: unknown }) {
  const [viewRaw, setViewRaw] = useState(false);
  const old = oldValue as Record<string, unknown> | null;
  const nw = newValue as Record<string, unknown> | null;
  const diffMode = !old && nw ? "create" : old && !nw ? "delete" : old && nw ? "update" : "none";

  if (viewRaw) {
    return (
      <div>
        <button
          onClick={() => setViewRaw(false)}
          style={{
            fontSize: 11,
            color: BRAND,
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          ← Formatted View
        </button>
        <pre
          style={{
            background: "#1A202C",
            color: "#E2E8F0",
            padding: 14,
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "'Fira Code', monospace",
            overflow: "auto",
            maxHeight: 300,
          }}
        >
          {JSON.stringify({ oldValue, newValue }, null, 2)}
        </pre>
      </div>
    );
  }

  if (diffMode === "none") {
    return (
      <div
        style={{
          padding: 16,
          background: "#F7F7F7",
          borderRadius: 8,
          color: LIGHT_TEXT,
          fontSize: 13,
        }}
      >
        No data captured
      </div>
    );
  }

  const allKeys = Array.from(new Set([...Object.keys(old ?? {}), ...Object.keys(nw ?? {})]));
  const changedKeys =
    diffMode === "update"
      ? allKeys.filter((k) => JSON.stringify(old?.[k]) !== JSON.stringify(nw?.[k]))
      : allKeys;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: diffMode === "create" ? GREEN : diffMode === "delete" ? RED : BRAND_DEEP,
          }}
        >
          {diffMode === "create" ? "✦ Created" : diffMode === "delete" ? "✦ Deleted" : "✦ Updated"}
        </span>
        <button
          onClick={() => setViewRaw(true)}
          style={{
            fontSize: 11,
            color: LIGHT_TEXT,
            background: "none",
            border: "none",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          View Raw →
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {changedKeys.map((k) => (
          <div
            key={k}
            style={{ borderRadius: 6, overflow: "hidden", border: `1px solid ${BORDER}` }}
          >
            <div
              style={{
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: MID_TEXT,
                background: BRAND_BG,
              }}
            >
              {k}
            </div>
            {(diffMode === "delete" || diffMode === "update") && old?.[k] !== undefined && (
              <div
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  fontFamily: "'Fira Code', monospace",
                  background: RED_LIGHT,
                  color: RED,
                }}
              >
                ── {typeof old[k] === "object" ? JSON.stringify(old[k]) : String(old[k])}
              </div>
            )}
            {(diffMode === "create" || diffMode === "update") && nw?.[k] !== undefined && (
              <div
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  fontFamily: "'Fira Code', monospace",
                  background: GREEN_LIGHT,
                  color: GREEN,
                }}
              >
                ++ {typeof nw[k] === "object" ? JSON.stringify(nw[k]) : String(nw[k])}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [actorId, setActorId] = useState<string>();
  const [action, setAction] = useState<string>();
  const [entityType, setEntityType] = useState<string>();
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const [quickFilter, setQuickFilter] = useState<QuickFilter>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useCallback((val: string) => {
    const timer = setTimeout(() => setSearch(val), 300);
    return () => clearTimeout(timer);
  }, []);

  const query = trpc.adminAudit.getAuditLog.useQuery(
    {
      page,
      limit,
      search: search || undefined,
      actorId,
      action,
      entityType,
      from,
      to,
      quickFilter,
    },
    { placeholderData: (prev) => prev }
  );

  const data = query.data;
  const entries = data?.entries ?? [];
  const selectedEntry = entries.find((e) => e.id === selectedId);

  const activeFilterCount = [actorId, action, entityType, from, to, search].filter(Boolean).length;

  function clearAll() {
    setSearch("");
    setSearchInput("");
    setActorId(undefined);
    setAction(undefined);
    setEntityType(undefined);
    setFrom(undefined);
    setTo(undefined);
    setQuickFilter(undefined);
    setPage(1);
  }

  /* ── Styles ──────────────────────────────────────────────────── */

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    border: `1.5px solid ${active ? BRAND : BORDER}`,
    cursor: "pointer",
    background: active ? `${BRAND}15` : WHITE,
    color: active ? BRAND_DEEP : MID_TEXT,
    transition: "all 0.2s",
    fontFamily: "'Inter', sans-serif",
  });

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 700,
    color: LIGHT_TEXT,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: `2px solid ${BORDER}`,
    textAlign: "left",
    background: BRAND_BG,
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: 13,
    color: DARK_TEXT,
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: "middle",
  };

  return (
    <div
      className="admin-fade-in"
      style={{ padding: "0.5rem 0", fontFamily: "'Inter', sans-serif", display: "flex", gap: 0 }}
    >
      {/* Main content area */}
      <div style={{ flex: 1, minWidth: 0, transition: "all 0.3s ease" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: DARK_TEXT,
                margin: 0,
                letterSpacing: "-0.015em",
              }}
            >
              Audit Log
            </h1>
            <p style={{ fontSize: 13, color: LIGHT_TEXT, margin: "4px 0 0" }}>
              System activity log for compliance and forensics
              {data ? ` · ${data.total} entries` : ""}
            </p>
          </div>
          <button
            onClick={() => entries.length && exportCSV(entries as Array<Record<string, unknown>>)}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: `1.5px solid ${BORDER}`,
              background: WHITE,
              color: MID_TEXT,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ↓ Export CSV
          </button>
        </div>

        {/* Quick filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.key}
              style={pillStyle(quickFilter === qf.key)}
              onClick={() => {
                setQuickFilter(quickFilter === qf.key ? undefined : qf.key);
                setPage(1);
              }}
            >
              {qf.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            placeholder="Search actions or IDs..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSearch(e.target.value);
            }}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            style={{ ...inputStyle, width: 200, fontSize: 12 }}
          />
          <select
            value={actorId ?? ""}
            onChange={(e) => {
              setActorId(e.target.value || undefined);
              setPage(1);
            }}
            style={{ ...inputStyle, width: 160, fontSize: 12 }}
          >
            <option value="">All Actors</option>
            {data?.actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={action ?? ""}
            onChange={(e) => {
              setAction(e.target.value || undefined);
              setPage(1);
            }}
            style={{ ...inputStyle, width: 180, fontSize: 12 }}
          >
            <option value="">All Actions</option>
            {data?.actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={entityType ?? ""}
            onChange={(e) => {
              setEntityType(e.target.value || undefined);
              setPage(1);
            }}
            style={{ ...inputStyle, width: 150, fontSize: 12 }}
          >
            <option value="">All Entities</option>
            {["test", "admin_user", "question", "result_interpretation", "user"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={from ?? ""}
            onChange={(e) => {
              setFrom(e.target.value || undefined);
              setPage(1);
            }}
            style={{ ...inputStyle, width: 140, fontSize: 12 }}
          />
          <input
            type="date"
            value={to ?? ""}
            onChange={(e) => {
              setTo(e.target.value || undefined);
              setPage(1);
            }}
            style={{ ...inputStyle, width: 140, fontSize: 12 }}
          />
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: `1.5px solid ${RED_BORDER}`,
                background: RED_LIGHT,
                color: RED,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear All ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Data table */}
        <div
          style={{
            borderRadius: 12,
            border: `1.5px solid ${BORDER}`,
            overflow: "hidden",
            background: WHITE,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Actor</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Entity</th>
                <th style={{ ...thStyle, width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ ...tdStyle, textAlign: "center", color: LIGHT_TEXT, padding: 40 }}
                  >
                    {query.isLoading ? "Loading..." : "No audit entries found"}
                  </td>
                </tr>
              ) : (
                entries.map((e) => {
                  const domain = domainOf(e.action);
                  const dc = DOMAIN_COLORS[domain];
                  const isSelected = e.id === selectedId;
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedId(isSelected ? null : e.id)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? BRAND_BG : undefined,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(ev) => {
                        if (!isSelected)
                          (ev.currentTarget as HTMLElement).style.background = "#FAFAFE";
                      }}
                      onMouseLeave={(ev) => {
                        if (!isSelected) (ev.currentTarget as HTMLElement).style.background = "";
                      }}
                    >
                      <td style={tdStyle}>
                        <span
                          title={new Date(e.createdAt).toLocaleString("en-GB", {
                            timeZone: "Asia/Jakarta",
                          })}
                        >
                          {relativeTime(e.createdAt)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {e.actorName ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: BRAND_LIGHT,
                                color: BRAND_DEEP,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              {initials(e.actorName)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: DARK_TEXT }}>
                                {e.actorName}
                              </div>
                              <div style={{ fontSize: 11, color: LIGHT_TEXT }}>{e.actorEmail}</div>
                            </div>
                          </div>
                        ) : e.adminUserId ? (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#F5F5F5",
                              color: LIGHT_TEXT,
                            }}
                          >
                            Deleted User
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: BRAND_LIGHT,
                              color: BRAND_DEEP,
                              fontWeight: 600,
                            }}
                          >
                            System
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "'Fira Code', monospace",
                            padding: "3px 10px",
                            borderRadius: 6,
                            background: dc.bg,
                            color: dc.color,
                            border: `1px solid ${dc.border}`,
                            fontWeight: 600,
                          }}
                        >
                          {e.action}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: BRAND_BG,
                            color: BRAND_DEEP,
                            marginRight: 6,
                          }}
                        >
                          {e.entityType}
                        </span>
                        <span style={{ fontSize: 12, color: DARK_TEXT }}>{e.entityLabel}</span>
                        <span
                          style={{
                            fontSize: 10,
                            color: LIGHT_TEXT,
                            fontFamily: "'Fira Code', monospace",
                            marginLeft: 6,
                          }}
                        >
                          {e.entityId.slice(0, 8)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: LIGHT_TEXT, fontSize: 14 }}>›</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: LIGHT_TEXT }}>Rows:</span>
            {[20, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setLimit(n);
                  setPage(1);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: `1px solid ${limit === n ? BRAND : BORDER}`,
                  background: limit === n ? BRAND_LIGHT : WHITE,
                  color: limit === n ? BRAND_DEEP : MID_TEXT,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: LIGHT_TEXT }}>
            {data
              ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, data.total)} of ${data.total}`
              : ""}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { label: "«", go: 1, disabled: page <= 1 },
              { label: "‹", go: page - 1, disabled: page <= 1 },
              { label: "›", go: page + 1, disabled: page >= (data?.pageCount ?? 1) },
              { label: "»", go: data?.pageCount ?? 1, disabled: page >= (data?.pageCount ?? 1) },
            ].map((b, i) => (
              <button
                key={i}
                disabled={b.disabled}
                onClick={() => setPage(b.go)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  background: WHITE,
                  color: b.disabled ? BORDER : MID_TEXT,
                  fontSize: 14,
                  cursor: b.disabled ? "default" : "pointer",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedEntry && (
        <div
          style={{
            width: 420,
            minWidth: 420,
            borderLeft: `1.5px solid ${BORDER}`,
            background: WHITE,
            padding: "20px 24px",
            marginLeft: 24,
            overflowY: "auto",
            maxHeight: "calc(100vh - 120px)",
            borderRadius: "0 12px 12px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div>
              {(() => {
                const dc = DOMAIN_COLORS[domainOf(selectedEntry.action)];
                return (
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: "'Fira Code', monospace",
                      padding: "5px 14px",
                      borderRadius: 8,
                      background: dc.bg,
                      color: dc.color,
                      border: `1px solid ${dc.border}`,
                      fontWeight: 700,
                    }}
                  >
                    {selectedEntry.action}
                  </span>
                );
              })()}
            </div>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                color: LIGHT_TEXT,
                cursor: "pointer",
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Entity info */}
          <div style={{ marginBottom: 20 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 4,
                background: BRAND_BG,
                color: BRAND_DEEP,
              }}
            >
              {selectedEntry.entityType}
            </span>
            <div style={{ fontSize: 14, fontWeight: 600, color: DARK_TEXT, marginTop: 6 }}>
              {selectedEntry.entityLabel}
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "'Fira Code', monospace",
                color: LIGHT_TEXT,
                marginTop: 2,
              }}
            >
              {selectedEntry.entityId}
            </div>
          </div>

          {/* Metadata */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
              padding: 14,
              background: BRAND_BG,
              borderRadius: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: LIGHT_TEXT,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Actor
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: DARK_TEXT }}>
                {selectedEntry.actorName ?? "System"}
              </div>
              {selectedEntry.actorEmail && (
                <div style={{ fontSize: 11, color: LIGHT_TEXT }}>{selectedEntry.actorEmail}</div>
              )}
              {selectedEntry.actorRole && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: BRAND_LIGHT,
                    color: BRAND_DEEP,
                    fontWeight: 600,
                  }}
                >
                  {selectedEntry.actorRole}
                </span>
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: LIGHT_TEXT,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Timestamp
              </div>
              <div style={{ fontSize: 12, color: DARK_TEXT }}>
                {new Date(selectedEntry.createdAt).toLocaleString("en-GB", {
                  timeZone: "Asia/Jakarta",
                  dateStyle: "medium",
                  timeStyle: "long",
                })}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: LIGHT_TEXT,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                IP Hash
              </div>
              <div
                style={{ fontSize: 11, fontFamily: "'Fira Code', monospace", color: LIGHT_TEXT }}
              >
                {selectedEntry.ipHash?.slice(0, 16) ?? "—"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: LIGHT_TEXT,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Entry ID
              </div>
              <div
                style={{ fontSize: 11, fontFamily: "'Fira Code', monospace", color: LIGHT_TEXT }}
              >
                {selectedEntry.id.slice(0, 8)}
              </div>
            </div>
          </div>

          {/* Diff block */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: MID_TEXT,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Changes
            </div>
            <DiffBlock oldValue={selectedEntry.oldValue} newValue={selectedEntry.newValue} />
          </div>

          {/* Copy JSON */}
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedEntry, null, 2))}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              border: `1.5px solid ${BORDER}`,
              background: WHITE,
              color: MID_TEXT,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Copy Full JSON
          </button>
        </div>
      )}
    </div>
  );
}
