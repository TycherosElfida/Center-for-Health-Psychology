"use client";

import { useState, useCallback, useMemo } from "react";
import { Filter } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { FilterBar } from "./FilterBar";
import { AnalyticsCards } from "./AnalyticsCards";
import { ResultsTable } from "./ResultsTable";
import { ExportDropdown } from "./ExportDropdown";
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
 * Generates a CSV string from result rows and triggers a browser download.
 */
function downloadCSV(rows: Array<Record<string, unknown>>, filename: string) {
  if (rows.length === 0) return;

  const headers = ["Name", "Sex", "Province", "City", "Age", "Score", "Category", "Date"];

  const csvRows = rows.map((r) =>
    [
      r.name ?? "",
      r.sex ?? "",
      r.province ?? "",
      r.city ?? "",
      r.age ?? "",
      r.totalScore ?? 0,
      r.resultLabel ?? "",
      r.createdAt ? new Date(r.createdAt as string).toLocaleDateString("en-GB") : "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

  const handleExportFiltered = useCallback(async () => {
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
      downloadCSV(
        data.rows as unknown as Array<Record<string, unknown>>,
        `${shortName}-filtered-results`
      );
    } finally {
      setIsExporting(false);
    }
  }, [slug, filters, sortField, sortDirection, shortName, utils]);

  const handleExportAll = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await utils.client.adminResults.export.query({
        testSlug: slug,
        sortBy: sortField,
        sortDir: sortDirection,
      });
      downloadCSV(
        data.rows as unknown as Array<Record<string, unknown>>,
        `${shortName}-all-results`
      );
    } finally {
      setIsExporting(false);
    }
  }, [slug, sortField, sortDirection, shortName, utils]);

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
              {activeFilterCount !== 1 ? "s" : ""} · {total} result
              {total !== 1 ? "s" : ""}
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
          <ExportDropdown
            testSlug={slug}
            totalCount={total}
            filteredCount={rows.length}
            hasAnyFilter={hasAnyFilter}
            onExportFiltered={handleExportFiltered}
            onExportAll={handleExportAll}
            isExporting={isExporting}
          />
        }
      />
    </div>
  );
}
