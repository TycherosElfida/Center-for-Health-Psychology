"use client";

import type { ReportRequestStatus } from "./types";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: ReportRequestStatus | "all";
  onStatusFilterChange: (v: ReportRequestStatus | "all") => void;
  testSlugFilter: string;
  onTestSlugFilterChange: (v: string) => void;
  availableTestSlugs: string[];
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  activeFilterCount: number;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  testSlugFilter,
  onTestSlugFilterChange,
  availableTestSlugs,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  activeFilterCount,
  onReset,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const inputStyle: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #E2DCF0",
    fontSize: "0.8125rem",
    background: "#ffffff",
    outline: "none",
    transition: "border-color 0.15s ease",
    color: "#1F2937",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "#8B7CB8",
    marginBottom: "0.25rem",
    display: "block",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "0.75rem",
        padding: "1rem 1.25rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Top row: search + results count + reset */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.875rem",
                opacity: 0.5,
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by requester…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ ...inputStyle, width: "100%", paddingLeft: "2rem" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
            {filteredCount === totalCount
              ? `${totalCount} requests`
              : `${filteredCount} of ${totalCount}`}
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              style={{
                ...inputStyle,
                cursor: "pointer",
                color: "#9B8EC4",
                fontWeight: 500,
                border: "1px solid #E2DCF0",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              ✕ Clear{" "}
              <span
                style={{
                  background: "#9B8EC4",
                  color: "#fff",
                  borderRadius: "9999px",
                  width: "18px",
                  height: "18px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                }}
              >
                {activeFilterCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: filters */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ReportRequestStatus | "all")}
            style={inputStyle}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="sent">Sent</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Test Type</label>
          <select
            value={testSlugFilter}
            onChange={(e) => onTestSlugFilterChange(e.target.value)}
            style={inputStyle}
          >
            <option value="">All Tests</option>
            {availableTestSlugs.map((slug) => (
              <option key={slug} value={slug}>
                {slug.toUpperCase().replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
