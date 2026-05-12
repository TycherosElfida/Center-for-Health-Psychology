"use client";

import { useState, useCallback, useMemo } from "react";
import { Filter } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { FilterBar } from "./FilterBar";
import { AnalyticsCards } from "./AnalyticsCards";
import { ResultsTable } from "./ResultsTable";
import { SplitExportButtons } from "./SplitExportButtons";
import * as XLSX from "xlsx";
import { ImportModal } from "./ImportModal";
import {
  DT,
  EMPTY_FILTERS,
  type FilterState,
  type SortField,
  type SortDirection,
  type TestTabConfig,
} from "./types";

const PAGE_SIZE = 20;

/**
 * Generates a CSV or XLSX from result rows and triggers a browser download.
 */
function downloadData(
  rows: Array<Record<string, unknown>>,
  filename: string,
  format: "csv" | "xlsx"
) {
  if (rows.length === 0) return;

  const exportData = rows.map((r) => ({
    Name: r.name ?? "",
    Sex: r.sex ?? "",
    "Province/City": `${r.province ?? ""} ${r.city ?? ""}`.trim(),
    Age: r.age ?? "",
    Score: r.totalScore ?? 0,
    Category: r.resultLabel ?? "",
    Date: r.createdAt ? new Date(r.createdAt as string).toLocaleDateString("en-GB") : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

  if (format === "csv") {
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(["\uFEFF" + csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}

interface TestResultsViewProps {
  testConfig: TestTabConfig;
}

export function TestResultsView({ testConfig }: TestResultsViewProps) {
  const { slug, shortName, maxScore } = testConfig;

  // ── Filter State ──────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [page, setPage] = useState(0);

  // ── Sort State ────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("testDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // ── Export State ──────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  // ── Import State ──────────────────────────────────────────────
  const [importModalOpen, setImportModalOpen] = useState(false);

  // ── Derived: has any filter active ────────────────────────────
  const hasAnyFilter = useMemo(
    () =>
      !!(
        filters.search ||
        filters.sex ||
        filters.province ||
        filters.city ||
        filters.ageMin ||
        filters.ageMax ||
        filters.scoreMin ||
        filters.scoreMax ||
        filters.category ||
        filters.dateFrom ||
        filters.dateTo
      ),
    [filters]
  );

  const activeFilterCount = useMemo(() => {
    return [
      filters.search,
      filters.sex,
      filters.province || filters.city ? "domicile" : "",
      filters.category,
      filters.ageMin || filters.ageMax ? "age" : "",
      filters.scoreMin || filters.scoreMax ? "score" : "",
      filters.dateFrom || filters.dateTo ? "date" : "",
    ].filter(Boolean).length;
  }, [filters]);

  // ── Build tRPC input ─────────────────────────────────────────
  const listInput = useMemo(
    () => ({
      testSlug: slug,
      search: filters.search || undefined,
      sex: (filters.sex || undefined) as "Male" | "Female" | undefined,
      province: filters.province || undefined,
      city: filters.city || undefined,
      ageMin: filters.ageMin ? Number(filters.ageMin) : undefined,
      ageMax: filters.ageMax ? Number(filters.ageMax) : undefined,
      scoreMin: filters.scoreMin ? Number(filters.scoreMin) : undefined,
      scoreMax: filters.scoreMax ? Number(filters.scoreMax) : undefined,
      category: filters.category || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sortBy: sortField,
      sortDir: sortDirection,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [slug, filters, sortField, sortDirection, page]
  );

  const statsInput = useMemo(
    () => ({
      testSlug: slug,
      search: filters.search || undefined,
      sex: (filters.sex || undefined) as "Male" | "Female" | undefined,
      province: filters.province || undefined,
      city: filters.city || undefined,
      ageMin: filters.ageMin ? Number(filters.ageMin) : undefined,
      ageMax: filters.ageMax ? Number(filters.ageMax) : undefined,
      scoreMin: filters.scoreMin ? Number(filters.scoreMin) : undefined,
      scoreMax: filters.scoreMax ? Number(filters.scoreMax) : undefined,
      category: filters.category || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }),
    [slug, filters]
  );

  // ── tRPC Queries ──────────────────────────────────────────────
  const listQuery = trpc.adminResults.list.useQuery(listInput);
  const statsQuery = trpc.adminResults.stats.useQuery(statsInput);
  const utils = trpc.useUtils();

  // ── Handlers ──────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(0); // Reset pagination on filter change
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS });
    setPage(0);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
      setPage(0);
    },
    [sortField]
  );

  const handleExportFiltered = useCallback(
    async (format: "csv" | "xlsx") => {
      setIsExporting(true);
      try {
        const data = await utils.client.adminResults.export.query({
          testSlug: slug,
          search: filters.search || undefined,
          sex: (filters.sex || undefined) as "Male" | "Female" | undefined,
          province: filters.province || undefined,
          city: filters.city || undefined,
          ageMin: filters.ageMin ? Number(filters.ageMin) : undefined,
          ageMax: filters.ageMax ? Number(filters.ageMax) : undefined,
          scoreMin: filters.scoreMin ? Number(filters.scoreMin) : undefined,
          scoreMax: filters.scoreMax ? Number(filters.scoreMax) : undefined,
          category: filters.category || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          sortBy: sortField,
          sortDir: sortDirection,
        });
        downloadData(
          data.rows as unknown as Array<Record<string, unknown>>,
          `${shortName}-filtered-results`,
          format
        );
      } finally {
        setIsExporting(false);
      }
    },
    [slug, filters, sortField, sortDirection, shortName, utils]
  );

  const handleExportAll = useCallback(
    async (format: "csv" | "xlsx") => {
      setIsExporting(true);
      try {
        const data = await utils.client.adminResults.export.query({
          testSlug: slug,
          sortBy: sortField,
          sortDir: sortDirection,
        });
        downloadData(
          data.rows as unknown as Array<Record<string, unknown>>,
          `${shortName}-all-results`,
          format
        );
      } finally {
        setIsExporting(false);
      }
    },
    [slug, sortField, sortDirection, shortName, utils]
  );

  // ── Render ────────────────────────────────────────────────────
  const total = listQuery.data?.total ?? 0;
  const rows = listQuery.data?.rows ?? [];

  const scoreLabel = `Score (0–${maxScore})`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2
            style={{
              fontWeight: 700,
              fontSize: 22,
              color: DT.DARK_TEXT,
              margin: 0,
            }}
          >
            {shortName} Results
          </h2>
          <p
            style={{
              fontSize: 13,
              color: DT.LIGHT_TEXT,
              margin: "2px 0 0",
            }}
          >
            {total} total records
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {hasAnyFilter && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                background: DT.TEAL_LIGHT,
                color: DT.TEAL_DARK,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Filter size={12} />
              {activeFilterCount} filter
              {activeFilterCount !== 1 ? "s" : ""} · {rows.length} result
              {rows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalCount={total}
        filteredCount={rows.length}
        hasAnyFilter={hasAnyFilter}
        scoreLabel={scoreLabel}
        provinces={statsQuery.data?.distinctProvinces ?? []}
        cities={statsQuery.data?.distinctCities ?? []}
        categories={statsQuery.data?.categoryDistribution?.map((c) => c.category) ?? []}
      />

      {/* Analytics cards */}
      <AnalyticsCards
        stats={statsQuery.data}
        isLoading={statsQuery.isLoading}
        hasAnyFilter={hasAnyFilter}
        testConfig={testConfig}
      />

      {/* Data table */}
      <ResultsTable
        rows={rows}
        isLoading={listQuery.isLoading}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        hasAnyFilter={hasAnyFilter}
        onClearFilters={handleResetFilters}
        testConfig={testConfig}
        exportActions={
          <>
            <button
              onClick={() => setImportModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 12,
                background: DT.WHITE,
                border: `1.5px solid ${testConfig.color}40`,
                color: testConfig.color,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                boxShadow: `0 1px 4px ${testConfig.color}12`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${testConfig.color}08`;
                e.currentTarget.style.borderColor = testConfig.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = DT.WHITE;
                e.currentTarget.style.borderColor = `${testConfig.color}40`;
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Import Data
            </button>
            <SplitExportButtons
              testSlug={slug}
              totalCount={total}
              filteredCount={rows.length}
              hasAnyFilter={hasAnyFilter}
              onExportFiltered={handleExportFiltered}
              onExportAll={handleExportAll}
              isExporting={isExporting}
            />
          </>
        }
      />

      {/* Modals */}
      {importModalOpen && (
        <ImportModal onClose={() => setImportModalOpen(false)} shortName={shortName} />
      )}
    </div>
  );
}
