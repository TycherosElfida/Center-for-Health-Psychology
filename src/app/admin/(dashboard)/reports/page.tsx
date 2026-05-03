"use client";

import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { StatCards } from "./_components/StatCards";
import { FilterBar } from "./_components/FilterBar";
import { RequestsTable } from "./_components/RequestsTable";
import { RejectModal } from "./_components/RejectModal";
import type {
  ReportRequestStatus,
  EnrichedReportRequest,
  SortField,
  SortDirection,
} from "./_components/types";

const PAGE_SIZE = 20;

export default function ReportsPage() {
  // ── Filter State ───────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<ReportRequestStatus | "all">("all");
  const [testSlugFilter, setTestSlugFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  // ── Sort State ─────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("requestedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // ── Selection State ────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Reject Modal State ─────────────────────────────────────────
  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    display: string;
  } | null>(null);

  // ── Processing State (per-row loading spinners) ────────────────
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // ── tRPC Queries ───────────────────────────────────────────────
  const statsQuery = trpc.reportRequests.stats.useQuery();

  const listQuery = trpc.reportRequests.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const utils = trpc.useUtils();

  // ── tRPC Mutations ─────────────────────────────────────────────
  const approveMutation = trpc.reportRequests.approve.useMutation({
    onMutate({ requestId }) {
      setProcessingIds((prev) => new Set(prev).add(requestId));
    },
    onSettled(_data, _err, { requestId }) {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      utils.reportRequests.list.invalidate();
      utils.reportRequests.stats.invalidate();
    },
  });

  const rejectMutation = trpc.reportRequests.reject.useMutation({
    onMutate({ requestId }) {
      setProcessingIds((prev) => new Set(prev).add(requestId));
    },
    onSettled(_data, _err, { requestId }) {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      setRejectTarget(null);
      utils.reportRequests.list.invalidate();
      utils.reportRequests.stats.invalidate();
    },
  });

  const batchApproveMutation = trpc.reportRequests.batchApprove.useMutation({
    onMutate({ requestIds }) {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        for (const id of requestIds) next.add(id);
        return next;
      });
    },
    onSettled() {
      setProcessingIds(new Set());
      setSelectedIds(new Set());
      utils.reportRequests.list.invalidate();
      utils.reportRequests.stats.invalidate();
    },
  });

  // ── Derived Data ───────────────────────────────────────────────
  const rawItems: EnrichedReportRequest[] = (listQuery.data?.items ??
    []) as EnrichedReportRequest[];

  // Client-side search filter (page-scoped, design spec §2 ADR-7)
  const searchFiltered = useMemo(() => {
    if (!search.trim()) return rawItems;
    const q = search.toLowerCase();
    return rawItems.filter((r) => r.requesterDisplay.toLowerCase().includes(q));
  }, [rawItems, search]);

  // Client-side test slug filter
  const testFiltered = useMemo(() => {
    if (!testSlugFilter) return searchFiltered;
    return searchFiltered.filter((r) => r.testSlug === testSlugFilter);
  }, [searchFiltered, testSlugFilter]);

  // Client-side sort
  const sorted = useMemo(() => {
    const arr = [...testFiltered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "requestedAt":
          cmp = new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
          break;
        case "requesterDisplay":
          cmp = a.requesterDisplay.localeCompare(b.requesterDisplay);
          break;
        case "testName":
          cmp = a.testName.localeCompare(b.testName);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [testFiltered, sortField, sortDirection]);

  // Available test slugs for filter dropdown
  const availableTestSlugs = useMemo(() => {
    const slugs = new Set(rawItems.map((r) => r.testSlug));
    return Array.from(slugs).sort();
  }, [rawItems]);

  // Active filter count
  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (testSlugFilter ? 1 : 0) +
    (search ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField]
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    const selectableIds = sorted
      .filter((r) => r.status === "pending" || r.status === "reviewed")
      .map((r) => r.id);
    setSelectedIds((prev) => {
      if (prev.size === selectableIds.length && selectableIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(selectableIds);
    });
  }, [sorted]);

  const allSelected = useMemo(() => {
    const selectableIds = sorted
      .filter((r) => r.status === "pending" || r.status === "reviewed")
      .map((r) => r.id);
    return selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  }, [sorted, selectedIds]);

  const handleApprove = useCallback(
    (id: string) => {
      approveMutation.mutate({ requestId: id });
    },
    [approveMutation]
  );

  const handleReject = useCallback(
    (id: string) => {
      const row = rawItems.find((r) => r.id === id);
      setRejectTarget({
        id,
        display: row?.requesterDisplay ?? id.slice(0, 8),
      });
    },
    [rawItems]
  );

  const handleRejectConfirm = useCallback(
    (reason?: string) => {
      if (!rejectTarget) return;
      rejectMutation.mutate({ requestId: rejectTarget.id, reason });
    },
    [rejectTarget, rejectMutation]
  );

  const handleBulkApprove = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    batchApproveMutation.mutate({ requestIds: ids });
  }, [selectedIds, batchApproveMutation]);

  const handleResetFilters = useCallback(() => {
    setStatusFilter("all");
    setTestSlugFilter("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }, []);

  // ── Pagination ─────────────────────────────────────────────────
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="admin-fade-in" style={{ padding: "1.5rem 2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1F2937", margin: 0 }}>
          Email Requests
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0.25rem 0 0" }}>
          Manage report delivery requests from assessment participants
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom: "1.5rem" }}>
        <StatCards stats={statsQuery.data ?? {}} isLoading={statsQuery.isLoading} />
      </div>

      {/* Filter Bar */}
      <div style={{ marginBottom: "1rem" }}>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
          testSlugFilter={testSlugFilter}
          onTestSlugFilterChange={(v) => {
            setTestSlugFilter(v);
            setPage(0);
          }}
          availableTestSlugs={availableTestSlugs}
          dateFrom={dateFrom}
          onDateFromChange={(v) => {
            setDateFrom(v);
            setPage(0);
          }}
          dateTo={dateTo}
          onDateToChange={(v) => {
            setDateTo(v);
            setPage(0);
          }}
          activeFilterCount={activeFilterCount}
          onReset={handleResetFilters}
          totalCount={total}
          filteredCount={sorted.length}
        />
      </div>

      {/* Requests Table */}
      <RequestsTable
        rows={sorted}
        isLoading={listQuery.isLoading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        allSelected={allSelected}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        processingIds={processingIds}
        onApprove={handleApprove}
        onReject={handleReject}
        onBulkApprove={handleBulkApprove}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #E2DCF0",
              background: "#ffffff",
              color: "#6B7280",
              fontSize: "0.8125rem",
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: "0.8125rem", color: "#6B7280" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #E2DCF0",
              background: "#ffffff",
              color: "#6B7280",
              fontSize: "0.8125rem",
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        requestId={rejectTarget?.id ?? null}
        requesterDisplay={rejectTarget?.display ?? ""}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
        isPending={rejectMutation.isPending}
      />
    </div>
  );
}
