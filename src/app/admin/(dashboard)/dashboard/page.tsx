"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCard, StatCardSkeleton } from "../_components/StatCard";
import { RecentResultsTable } from "../_components/RecentResultsTable";

export default function AdminDashboardPage() {
  const statsQuery = trpc.adminDashboard.stats.useQuery(undefined, {
    refetchInterval: 30_000, // Auto-refresh every 30s
  });

  const isLoading = statsQuery.isLoading;
  const data = statsQuery.data;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Assessments"
              value={data?.totalCompleted ?? 0}
              icon="📋"
              subtitle="completed assessments"
            />
            <StatCard
              title="Active Sessions"
              value={data?.activeSessions ?? 0}
              icon="⚡"
              subtitle="in progress"
            />
            <StatCard
              title="Completion Rate"
              value={`${data?.completionRate ?? 0}%`}
              icon="📈"
              subtitle="completed vs abandoned"
            />
            <StatCard
              title="Pending Reports"
              value={data?.pendingReports ?? 0}
              icon="📧"
              subtitle="awaiting review"
            />
          </>
        )}
      </div>

      {/* Recent Results Table */}
      <RecentResultsTable results={data?.recentResults} isLoading={isLoading} />
    </div>
  );
}
