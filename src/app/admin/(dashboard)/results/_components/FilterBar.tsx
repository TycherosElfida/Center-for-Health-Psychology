"use client";

import { Search, X, SlidersHorizontal, RotateCcw, Calendar } from "lucide-react";
import { DT, type FilterState } from "./types";
import { MiniSelect } from "./MiniSelect";

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

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
  hasAnyFilter: boolean;
  scoreLabel: string;
  provinces: string[];
  cities: string[];
  categories: string[];
}

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  totalCount,
  filteredCount,
  hasAnyFilter,
  scoreLabel,
  provinces,
  cities,
  categories,
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
            <MiniSelect
              value={filters.province}
              onChange={(v) => onFilterChange("province", v)}
              options={provinces}
              placeholder="All"
            />
          </div>

          {/* City */}
          <div>
            <div style={labelStyle}>City / Regency</div>
            <MiniSelect
              value={filters.city}
              onChange={(v) => onFilterChange("city", v)}
              options={cities}
              placeholder="All"
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
            <MiniSelect
              value={filters.category}
              onChange={(v) => onFilterChange("category", v)}
              options={categories}
              placeholder="All"
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
