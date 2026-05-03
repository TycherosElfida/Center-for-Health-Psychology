"use client";

import type { ReportRequestStatus } from "./types";

const STAT_CONFIG: Array<{
  key: ReportRequestStatus;
  label: string;
  icon: string;
  cssClass: string;
}> = [
  { key: "pending", label: "Pending", icon: "⏳", cssClass: "admin-status-pending" },
  { key: "reviewed", label: "Reviewed", icon: "👁️", cssClass: "admin-status-reviewed" },
  { key: "sent", label: "Sent", icon: "✉️", cssClass: "admin-status-sent" },
  { key: "rejected", label: "Rejected", icon: "✕", cssClass: "admin-status-rejected" },
];

interface StatCardsProps {
  stats: Record<string, number>;
  isLoading: boolean;
}

export function StatCards({ stats, isLoading }: StatCardsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
      {STAT_CONFIG.map((stat) => (
        <div
          key={stat.key}
          className="admin-stat-card"
          style={{
            background: "#ffffff",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}
          >
            <span
              className={stat.cssClass}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
              }}
            >
              {stat.icon}
            </span>
            <span style={{ fontSize: "0.8125rem", color: "#6B7280", fontWeight: 500 }}>
              {stat.label}
            </span>
          </div>
          {isLoading ? (
            <div
              className="admin-skeleton"
              style={{ width: "3rem", height: "2rem", borderRadius: "0.375rem" }}
            />
          ) : (
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1F2937" }}>
              {stats[stat.key] ?? 0}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
