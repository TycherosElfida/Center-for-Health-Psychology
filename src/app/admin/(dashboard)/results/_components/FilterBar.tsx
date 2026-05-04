"use client";

import { Search, X, SlidersHorizontal, RotateCcw, Calendar } from "lucide-react";
import { DT, type FilterState } from "./types";

/* ── Shared inline styles (design reference tokens) ── */
const inputStyle: React.CSSProperties = {
  background: DT.WHITE,
  border: `1px solid ${DT.BORDER}`,
  borderRadius: 10,
  padding: "7px 10px",
  fontSize: 12,
  color: DT.DARK_TEXT,
  fontWeight: 500,
  outline: "none",
  width: "100%",
  fontFamily: "'Inter', sans-serif",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: DT.LIGHT_TEXT,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
  fontFamily: "'Inter', sans-serif",
};

/* ── Reusable mini select ── */
function MiniSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...inputStyle,
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23718096' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        paddingRight: 28,
        cursor: "pointer",
        color: value ? DT.DARK_TEXT : DT.LIGHT_TEXT,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
  hasAnyFilter: boolean;
  scoreLabel: string;
}

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  totalCount,
  filteredCount,
  hasAnyFilter,
  scoreLabel,
}: FilterBarProps) {
  return (
    <div
      style={{
        background: DT.WHITE,
        border: `1px solid ${DT.BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: `1px solid ${DT.BORDER}`,
          background: DT.BG_CONTENT,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={14} color={DT.TEAL_DARK} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: DT.TEAL_DARK,
            }}
          >
            Filters & Search
          </span>
          {hasAnyFilter && (
            <span
              style={{
                fontSize: 11,
                color: DT.LIGHT_TEXT,
                fontWeight: 400,
              }}
            >
              — Showing {filteredCount} of {totalCount}
            </span>
          )}
        </div>
        {hasAnyFilter && (
          <button
            onClick={onReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: "#E53E3E",
              background: "#FFF5F5",
              border: "1px solid #FED7D7",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={10} /> Reset All
          </button>
        )}
      </div>

      {/* Filter grid */}
      <div style={{ padding: "16px 20px" }}>
        {/* Row 1: 6 equal columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {/* Name search */}
          <div>
            <div style={labelStyle}>Name</div>
            <div
              style={{
                ...inputStyle,
                padding: 0,
                paddingLeft: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Search size={12} color={DT.LIGHT_TEXT} style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => onFilterChange("search", e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 12,
                  color: DT.DARK_TEXT,
                  fontWeight: 500,
                  width: "100%",
                  padding: "7px 10px 7px 4px",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              {filters.search && (
                <button
                  onClick={() => onFilterChange("search", "")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 8px",
                    display: "flex",
                  }}
                >
                  <X size={11} color={DT.LIGHT_TEXT} />
                </button>
              )}
            </div>
          </div>

          {/* Sex */}
          <div>
            <div style={labelStyle}>Sex</div>
            <MiniSelect
              value={filters.sex}
              onChange={(v) => onFilterChange("sex", v as FilterState["sex"])}
              options={["Male", "Female"]}
              placeholder="All"
            />
          </div>

          {/* Province */}
          <div>
            <div style={labelStyle}>Province</div>
            <input
              type="text"
              placeholder="e.g. Jawa Timur"
              value={filters.province}
              onChange={(e) => onFilterChange("province", e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* City */}
          <div>
            <div style={labelStyle}>City / Regency</div>
            <input
              type="text"
              placeholder="e.g. Surabaya"
              value={filters.city}
              onChange={(e) => onFilterChange("city", e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Age range */}
          <div>
            <div style={labelStyle}>Age Range</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="number"
                placeholder="Min"
                value={filters.ageMin}
                onChange={(e) => onFilterChange("ageMin", e.target.value)}
                style={{ ...inputStyle, textAlign: "center" }}
                min={0}
              />
              <span
                style={{
                  fontSize: 11,
                  color: DT.LIGHT_TEXT,
                  flexShrink: 0,
                }}
              >
                –
              </span>
              <input
                type="number"
                placeholder="Max"
                value={filters.ageMax}
                onChange={(e) => onFilterChange("ageMax", e.target.value)}
                style={{ ...inputStyle, textAlign: "center" }}
                min={0}
              />
            </div>
          </div>

          {/* Score range */}
          <div>
            <div style={labelStyle}>{scoreLabel}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="number"
                placeholder="Min"
                value={filters.scoreMin}
                onChange={(e) => onFilterChange("scoreMin", e.target.value)}
                style={{ ...inputStyle, textAlign: "center" }}
                min={0}
              />
              <span
                style={{
                  fontSize: 11,
                  color: DT.LIGHT_TEXT,
                  flexShrink: 0,
                }}
              >
                –
              </span>
              <input
                type="number"
                placeholder="Max"
                value={filters.scoreMax}
                onChange={(e) => onFilterChange("scoreMax", e.target.value)}
                style={{ ...inputStyle, textAlign: "center" }}
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Category + Date range */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 12,
          }}
        >
          {/* Category */}
          <div>
            <div style={labelStyle}>Result Category</div>
            <input
              type="text"
              placeholder="e.g. Normal, High Stress"
              value={filters.category}
              onChange={(e) => onFilterChange("category", e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Date range */}
          <div>
            <div style={labelStyle}>Test Date Range</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  ...inputStyle,
                  padding: 0,
                  paddingLeft: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                }}
              >
                <Calendar size={12} color={DT.LIGHT_TEXT} style={{ flexShrink: 0 }} />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFilterChange("dateFrom", e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 12,
                    color: filters.dateFrom ? DT.DARK_TEXT : DT.LIGHT_TEXT,
                    fontWeight: 500,
                    width: "100%",
                    padding: "5px 6px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: DT.LIGHT_TEXT,
                  flexShrink: 0,
                }}
              >
                to
              </span>
              <div
                style={{
                  ...inputStyle,
                  padding: 0,
                  paddingLeft: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                }}
              >
                <Calendar size={12} color={DT.LIGHT_TEXT} style={{ flexShrink: 0 }} />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFilterChange("dateTo", e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 12,
                    color: filters.dateTo ? DT.DARK_TEXT : DT.LIGHT_TEXT,
                    fontWeight: 500,
                    width: "100%",
                    padding: "5px 6px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
