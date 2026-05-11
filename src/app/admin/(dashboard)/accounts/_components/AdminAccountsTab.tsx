"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Unlock, UserX, UserCheck, KeyRound, LogOut, Plus, X } from "lucide-react";

const DT = {
  TEAL: "#9B8EC4",
  TEAL_DARK: "#6B5CA0",
  TEAL_LIGHT: "#EDE9F8",
  DARK_TEXT: "#1A202C",
  MID_TEXT: "#4A5568",
  LIGHT_TEXT: "#718096",
  BORDER: "#E2DCF0",
  WHITE: "#FFFFFF",
  BG_ALT: "#FBFAFD",
  BG_HEADER: "#F5F3FA",
} as const;

const ROLE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  super_admin: { bg: "#FFEBEE", text: "#C62828", label: "Super Admin" },
  admin: { bg: "#E3F2FD", text: "#1565C0", label: "Admin" },
  psychiatrist: { bg: "#E8F5E9", text: "#2E7D32", label: "Psychiatrist" },
  researcher: { bg: "#FFF8E1", text: "#F57F17", label: "Researcher" },
};

function Badge({ role }: { role: string }) {
  const c = ROLE_BADGES[role] ?? { bg: "#F5F5F5", text: "#666", label: role };
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
      }}
    >
      {c.label}
    </span>
  );
}

function StatusDot({ active, locked }: { active: boolean; locked: boolean }) {
  const color = locked ? "#F57F17" : active ? "#2E7D32" : "#C62828";
  const label = locked ? "Locked" : active ? "Active" : "Inactive";
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

// ── Create Admin Dialog ─────────────────────────────────────────────
function CreateAdminDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "psychiatrist" | "researcher",
  });
  const createMutation = trpc.adminAccounts.createAdmin.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: DT.WHITE,
          borderRadius: 16,
          padding: 28,
          width: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: DT.DARK_TEXT, margin: 0 }}>
            Create Admin Account
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: DT.LIGHT_TEXT }}
          >
            <X size={18} />
          </button>
        </div>
        {createMutation.error && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#FFEBEE",
              color: "#C62828",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {createMutation.error.message}
          </div>
        )}
        {(["name", "email", "password"] as const).map((field) => (
          <div key={field} style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: DT.MID_TEXT,
                marginBottom: 4,
                textTransform: "capitalize",
              }}
            >
              {field}
            </label>
            <input
              type={field === "password" ? "password" : field === "email" ? "email" : "text"}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              placeholder={field === "password" ? "Min 12 characters" : ""}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${DT.BORDER}`,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: DT.MID_TEXT,
              marginBottom: 4,
            }}
          >
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${DT.BORDER}`,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          >
            <option value="admin">Admin</option>
            <option value="psychiatrist">Psychiatrist</option>
            <option value="researcher">Researcher</option>
          </select>
        </div>
        {form.password.length > 0 && form.password.length < 12 && (
          <div
            style={{
              fontSize: 11,
              color: "#C62828",
              marginBottom: 12,
              marginTop: -8,
            }}
          >
            Password must be at least 12 characters ({form.password.length}/12)
          </div>
        )}
        <button
          onClick={() => createMutation.mutate(form)}
          disabled={
            createMutation.isPending || !form.name || !form.email || form.password.length < 12
          }
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            background:
              !form.name || !form.email || form.password.length < 12 ? "#C4B8DC" : DT.TEAL,
            color: DT.WHITE,
            fontWeight: 600,
            fontSize: 13,
            border: "none",
            cursor:
              createMutation.isPending || !form.name || !form.email || form.password.length < 12
                ? "not-allowed"
                : "pointer",
            opacity: createMutation.isPending ? 0.6 : 1,
          }}
        >
          {createMutation.isPending ? "Creating..." : "Create Account"}
        </button>
      </div>
    </div>
  );
}

// ── Detail Panel ────────────────────────────────────────────────────
function AdminDetailPanel({ adminId, onClose }: { adminId: string; onClose: () => void }) {
  const utils = trpc.useUtils();
  const detail = trpc.adminAccounts.getAdminById.useQuery({ adminId });
  const toggleActive = trpc.adminAccounts.toggleAdminActive.useMutation({
    onSuccess: () => {
      utils.adminAccounts.invalidate();
    },
  });
  const unlockAdmin = trpc.adminAccounts.unlockAdmin.useMutation({
    onSuccess: () => {
      utils.adminAccounts.invalidate();
    },
  });
  const forceReset = trpc.adminAccounts.forcePasswordReset.useMutation({
    onSuccess: () => {
      utils.adminAccounts.invalidate();
    },
  });
  const invalidateSession = trpc.adminAccounts.invalidateAdminSession.useMutation({
    onSuccess: () => {
      utils.adminAccounts.invalidate();
    },
  });

  if (detail.isLoading) return <div style={{ padding: 24, color: DT.LIGHT_TEXT }}>Loading...</div>;
  if (!detail.data) return null;
  const a = detail.data;

  return (
    <div
      style={{
        background: DT.WHITE,
        borderRadius: 16,
        border: `1px solid ${DT.BORDER}`,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: 20,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: DT.DARK_TEXT, margin: 0 }}>
            {a.name}
          </h3>
          <p style={{ fontSize: 13, color: DT.LIGHT_TEXT, margin: "4px 0 0" }}>{a.email}</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: DT.LIGHT_TEXT }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 12, borderRadius: 10, background: DT.BG_ALT }}>
          <div style={{ fontSize: 11, color: DT.LIGHT_TEXT, marginBottom: 4 }}>Role</div>
          <Badge role={a.role} />
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: DT.BG_ALT }}>
          <div style={{ fontSize: 11, color: DT.LIGHT_TEXT, marginBottom: 4 }}>Status</div>
          <StatusDot active={a.isActive} locked={!!a.lockedAt} />
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: DT.BG_ALT }}>
          <div style={{ fontSize: 11, color: DT.LIGHT_TEXT, marginBottom: 4 }}>Created</div>
          <div style={{ fontSize: 13, color: DT.DARK_TEXT }}>
            {new Date(a.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: DT.BG_ALT }}>
          <div style={{ fontSize: 11, color: DT.LIGHT_TEXT, marginBottom: 4 }}>Last Login</div>
          <div style={{ fontSize: 13, color: DT.DARK_TEXT }}>
            {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : "Never"}
          </div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: DT.BG_ALT, gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 11, color: DT.LIGHT_TEXT, marginBottom: 4 }}>Login History</div>
          <div style={{ fontSize: 12, color: DT.LIGHT_TEXT, fontStyle: "italic" }}>
            Deferred — will be available in a future release
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {a.lockedAt && (
          <button
            onClick={() => unlockAdmin.mutate({ adminId })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${DT.BORDER}`,
              background: DT.WHITE,
              cursor: "pointer",
              fontSize: 13,
              color: DT.MID_TEXT,
            }}
          >
            <Unlock size={14} /> Unlock Account
          </button>
        )}
        <button
          onClick={() => forceReset.mutate({ adminId })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${DT.BORDER}`,
            background: DT.WHITE,
            cursor: "pointer",
            fontSize: 13,
            color: DT.MID_TEXT,
          }}
        >
          <KeyRound size={14} /> Force Password Reset
        </button>
        <button
          onClick={() => invalidateSession.mutate({ adminId })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${DT.BORDER}`,
            background: DT.WHITE,
            cursor: "pointer",
            fontSize: 13,
            color: DT.MID_TEXT,
          }}
        >
          <LogOut size={14} /> Force Logout
        </button>
        <button
          onClick={() => toggleActive.mutate({ adminId, active: !a.isActive })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${a.isActive ? "#FFCDD2" : "#C8E6C9"}`,
            background: a.isActive ? "#FFF5F5" : "#F1F8E9",
            cursor: "pointer",
            fontSize: 13,
            color: a.isActive ? "#C62828" : "#2E7D32",
          }}
        >
          {a.isActive ? (
            <>
              <UserX size={14} /> Deactivate
            </>
          ) : (
            <>
              <UserCheck size={14} /> Reactivate
            </>
          )}
        </button>
      </div>
      {toggleActive.error && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 8,
            background: "#FFEBEE",
            color: "#C62828",
            fontSize: 12,
          }}
        >
          {toggleActive.error.message}
        </div>
      )}
      {invalidateSession.error && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 8,
            background: "#FFEBEE",
            color: "#C62828",
            fontSize: 12,
          }}
        >
          {invalidateSession.error.message}
        </div>
      )}
    </div>
  );
}

// ── Main Tab ────────────────────────────────────────────────────────
export function AdminAccountsTab() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const query = trpc.adminAccounts.listAdmins.useQuery({
    search: search || undefined,
    role: (roleFilter || undefined) as
      | "super_admin"
      | "admin"
      | "psychiatrist"
      | "researcher"
      | undefined,
  });

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 380px" : "1fr", gap: 20 }}
    >
      <div>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: `1px solid ${DT.BORDER}`,
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="psychiatrist">Psychiatrist</option>
            <option value="researcher">Researcher</option>
          </select>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: DT.TEAL,
              color: DT.WHITE,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Plus size={14} /> Create
          </button>
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
                {["Name", "Email", "Role", "Status", "Last Login"].map((h) => (
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
                  <td
                    colSpan={5}
                    style={{ padding: 24, textAlign: "center", color: DT.LIGHT_TEXT }}
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {query.data?.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  style={{
                    cursor: "pointer",
                    borderBottom: `1px solid ${DT.BORDER}`,
                    background: selectedId === a.id ? DT.TEAL_LIGHT : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedId !== a.id) e.currentTarget.style.background = DT.BG_ALT;
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== a.id) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "10px 14px", fontWeight: 500, color: DT.DARK_TEXT }}>
                    {a.name}
                  </td>
                  <td style={{ padding: "10px 14px", color: DT.MID_TEXT }}>{a.email}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge role={a.role} />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <StatusDot active={a.isActive} locked={!!a.lockedAt} />
                  </td>
                  <td style={{ padding: "10px 14px", color: DT.LIGHT_TEXT, fontSize: 12 }}>
                    {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              ))}
              {query.data?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: 24, textAlign: "center", color: DT.LIGHT_TEXT }}
                  >
                    No admin accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedId && <AdminDetailPanel adminId={selectedId} onClose={() => setSelectedId(null)} />}

      {/* Create Dialog */}
      {showCreate && (
        <CreateAdminDialog
          onClose={() => setShowCreate(false)}
          onSuccess={() => utils.adminAccounts.listAdmins.invalidate()}
        />
      )}
    </div>
  );
}
