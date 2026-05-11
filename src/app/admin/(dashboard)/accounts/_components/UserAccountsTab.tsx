"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { UserX, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";

const DT = {
  TEAL: "#9B8EC4",
  DARK_TEXT: "#1A202C",
  MID_TEXT: "#4A5568",
  LIGHT_TEXT: "#718096",
  BORDER: "#E2DCF0",
  WHITE: "#FFFFFF",
  BG_ALT: "#FBFAFD",
  BG_HEADER: "#F5F3FA",
} as const;

export function UserAccountsTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const query = trpc.adminUserAccounts.listUsers.useQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const toggleActive = trpc.adminUserAccounts.toggleUserActive.useMutation({
    onSuccess: () => utils.adminUserAccounts.listUsers.invalidate(),
  });

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: 10,
            border: `1px solid ${DT.BORDER}`,
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: DT.WHITE,
          borderRadius: 14,
          border: `1px solid ${DT.BORDER}`,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: DT.BG_HEADER }}>
              {["Name", "Email", "Status", "Sessions", "Last Session", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: DT.LIGHT_TEXT,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {query.isLoading && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: "center", color: DT.LIGHT_TEXT }}>
                  Loading...
                </td>
              </tr>
            )}
            {query.data?.users.map((u) => (
              <tr
                key={u.id}
                style={{ borderBottom: `1px solid ${DT.BORDER}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = DT.BG_ALT)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "10px 14px", fontWeight: 500, color: DT.DARK_TEXT }}>
                  {u.name ?? "—"}
                </td>
                <td style={{ padding: "10px 14px", color: DT.MID_TEXT }}>{u.email}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: u.isActive ? "#2E7D32" : "#C62828",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: u.isActive ? "#2E7D32" : "#C62828",
                        display: "inline-block",
                      }}
                    />
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: DT.MID_TEXT }}>{u.sessionCount}</td>
                <td style={{ padding: "10px 14px", color: DT.LIGHT_TEXT, fontSize: 12 }}>
                  {u.lastSessionAt ? new Date(u.lastSessionAt).toLocaleDateString() : "Never"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <button
                    onClick={() => toggleActive.mutate({ userId: u.id, active: !u.isActive })}
                    disabled={toggleActive.isPending}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${u.isActive ? "#FFCDD2" : "#C8E6C9"}`,
                      background: u.isActive ? "#FFF5F5" : "#F1F8E9",
                      cursor: "pointer",
                      fontSize: 11,
                      color: u.isActive ? "#C62828" : "#2E7D32",
                    }}
                  >
                    {u.isActive ? (
                      <>
                        <UserX size={12} /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck size={12} /> Reactivate
                      </>
                    )}
                  </button>
                  {!u.isActive && (
                    <div
                      style={{
                        fontSize: 10,
                        color: DT.LIGHT_TEXT,
                        marginTop: 2,
                        fontStyle: "italic",
                      }}
                    >
                      Blocked on next login
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {query.data?.users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: "center", color: DT.LIGHT_TEXT }}>
                  No users found
                </td>
              </tr>
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
          fontSize: 13,
          color: DT.MID_TEXT,
        }}
      >
        <span>{query.data?.total ?? 0} total users</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${DT.BORDER}`,
              background: DT.WHITE,
              cursor: page <= 1 ? "default" : "pointer",
              opacity: page <= 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${DT.BORDER}`,
              background: DT.WHITE,
              cursor: page >= totalPages ? "default" : "pointer",
              opacity: page >= totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
