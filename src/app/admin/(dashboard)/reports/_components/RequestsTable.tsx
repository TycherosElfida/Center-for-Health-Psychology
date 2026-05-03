"use client";

import type { EnrichedReportRequest, SortField, SortDirection } from "./types";

/* ── Status badge color mapping (ADR-9: hardcoded, maintenance point) ── */
const STATUS_DISPLAY: Record<string, { label: string; cssClass: string }> = {
  pending: { label: "Pending", cssClass: "admin-status-pending" },
  reviewed: { label: "Reviewed", cssClass: "admin-status-reviewed" },
  sent: { label: "Sent", cssClass: "admin-status-sent" },
  rejected: { label: "Rejected", cssClass: "admin-status-rejected" },
};

interface RequestsTableProps {
  rows: EnrichedReportRequest[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  processingIds: Set<string>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onBulkApprove: () => void;
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(d));
}

function SortIndicator({
  field,
  current,
  direction,
}: {
  field: SortField;
  current: SortField;
  direction: SortDirection;
}) {
  if (field !== current) return <span style={{ opacity: 0.3, marginLeft: "4px" }}>↕</span>;
  return <span style={{ marginLeft: "4px" }}>{direction === "asc" ? "↑" : "↓"}</span>;
}

export function RequestsTable({
  rows,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  sortField,
  sortDirection,
  onSort,
  processingIds,
  onApprove,
  onReject,
  onBulkApprove,
}: RequestsTableProps) {
  const selectableRows = rows.filter((r) => r.status === "pending" || r.status === "reviewed");
  const selectedCount = selectedIds.size;

  const thStyle: React.CSSProperties = {
    padding: "0.625rem 0.75rem",
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#8B7CB8",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.625rem 0.75rem",
    fontSize: "0.8125rem",
    color: "#374151",
    borderTop: "1px solid #F3F0F9",
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: "0.75rem",
          padding: "2rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="admin-skeleton"
            style={{ height: "2.5rem", marginBottom: "0.5rem", borderRadius: "0.375rem" }}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: "0.75rem",
          padding: "3rem 2rem",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📭</div>
        <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#374151" }}>
          No requests found
        </div>
        <div style={{ fontSize: "0.8125rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
          Try adjusting your filters or check back later.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
        overflow: "auto",
      }}
    >
      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.625rem 1rem",
            background: "#F5F3FA",
            borderBottom: "1px solid #E2DCF0",
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "#6B5CA0", fontWeight: 500 }}>
            {selectedCount} selected
          </span>
          <button
            onClick={onBulkApprove}
            className="admin-btn-approve"
            style={{ padding: "0.375rem 0.875rem", fontSize: "0.75rem", fontWeight: 600 }}
          >
            ✉️ Approve Selected
          </button>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr className="admin-table-header">
            <th style={{ ...thStyle, width: "32px", cursor: "default" }}>
              <input
                type="checkbox"
                checked={allSelected && selectableRows.length > 0}
                onChange={onToggleSelectAll}
                disabled={selectableRows.length === 0}
                style={{ cursor: "pointer" }}
                aria-label="Select all"
              />
            </th>
            <th style={thStyle}>ID</th>
            <th style={thStyle} onClick={() => onSort("requesterDisplay")}>
              Requester{" "}
              <SortIndicator
                field="requesterDisplay"
                current={sortField}
                direction={sortDirection}
              />
            </th>
            <th style={thStyle} onClick={() => onSort("testName")}>
              Test <SortIndicator field="testName" current={sortField} direction={sortDirection} />
            </th>
            <th style={thStyle}>Score</th>
            <th style={thStyle} onClick={() => onSort("status")}>
              Status <SortIndicator field="status" current={sortField} direction={sortDirection} />
            </th>
            <th style={thStyle} onClick={() => onSort("requestedAt")}>
              Requested{" "}
              <SortIndicator field="requestedAt" current={sortField} direction={sortDirection} />
            </th>
            <th style={{ ...thStyle, textAlign: "right", cursor: "default" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isProcessing = processingIds.has(row.id);
            const isSelected = selectedIds.has(row.id);
            const canAct = row.status === "pending" || row.status === "reviewed";
            const statusInfo = STATUS_DISPLAY[row.status] ?? { label: row.status, cssClass: "" };

            return (
              <tr
                key={row.id}
                className={
                  isSelected
                    ? "admin-table-row-selected"
                    : idx % 2 === 1
                      ? "admin-table-row-alt"
                      : ""
                }
              >
                {/* Checkbox */}
                <td style={tdStyle}>
                  {canAct ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(row.id)}
                      disabled={isProcessing}
                      style={{ cursor: "pointer" }}
                      aria-label={`Select request ${row.id.slice(0, 8)}`}
                    />
                  ) : (
                    <span style={{ opacity: 0.2 }}>—</span>
                  )}
                </td>

                {/* ID (truncated UUID) */}
                <td style={tdStyle}>
                  <code
                    style={{
                      fontSize: "0.75rem",
                      color: "#9B8EC4",
                      background: "#F5F3FA",
                      padding: "0.125rem 0.375rem",
                      borderRadius: "0.25rem",
                    }}
                  >
                    #{row.id.slice(0, 8)}
                  </code>
                </td>

                {/* Requester */}
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                      {row.requesterType === "guest" ? "👤" : "🔐"}
                    </span>
                    <span style={{ fontWeight: 500 }}>{row.requesterDisplay}</span>
                  </div>
                </td>

                {/* Test */}
                <td style={tdStyle}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      padding: "0.125rem 0.5rem",
                      borderRadius: "9999px",
                      background: "#F0ECFA",
                      color: "#6B5CA0",
                    }}
                  >
                    {row.testName}
                  </span>
                </td>

                {/* Score */}
                <td style={tdStyle}>
                  {row.totalScore !== null ? (
                    <span>
                      <strong>{row.totalScore}</strong>
                      {row.resultLabel && (
                        <span
                          style={{ fontSize: "0.75rem", color: "#9CA3AF", marginLeft: "0.375rem" }}
                        >
                          ({row.resultLabel})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: "#D1D5DB" }}>—</span>
                  )}
                </td>

                {/* Status badge */}
                <td style={tdStyle}>
                  <span
                    className={statusInfo.cssClass}
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      padding: "0.1875rem 0.5rem",
                      borderRadius: "9999px",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </td>

                {/* Date */}
                <td style={{ ...tdStyle, fontSize: "0.75rem", color: "#6B7280" }}>
                  {formatDate(row.requestedAt)}
                </td>

                {/* Actions */}
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {isProcessing ? (
                    <span
                      className="admin-spin"
                      style={{ display: "inline-block", fontSize: "1rem" }}
                    >
                      ⟳
                    </span>
                  ) : canAct ? (
                    <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => onApprove(row.id)}
                        className="admin-btn-approve"
                        style={{
                          padding: "0.25rem 0.625rem",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(row.id)}
                        className="admin-btn-reject"
                        style={{
                          padding: "0.25rem 0.625rem",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#D1D5DB" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
