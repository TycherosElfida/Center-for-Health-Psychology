"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Pencil, Check, X, AlertTriangle } from "lucide-react";

const DT = {
  TEAL: "#9B8EC4",
  TEAL_DARK: "#6B5CA0",
  TEAL_LIGHT: "#EDE9F8",
  BRAND_BG: "#F5F3FA",
  DARK_TEXT: "#1A202C",
  MID_TEXT: "#4A5568",
  LIGHT_TEXT: "#718096",
  BORDER: "#E2DCF0",
  WHITE: "#FFFFFF",
  BG_ALT: "#FBFAFD",
  RED: "#C62828",
  RED_BG: "#FFEBEE",
  GREEN: "#2E7D32",
  GREEN_BG: "#E8F5E9",
  WARNING: "#E65100",
  WARNING_BG: "#FFF3E0",
  WARNING_BORDER: "#FFE0B2",
  DISABLED: "#C4B8DC",
} as const;

const ROLE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  super_admin: { bg: "#FFEBEE", text: "#C62828", label: "Super Admin" },
  admin: { bg: "#E3F2FD", text: "#1565C0", label: "Admin" },
  psychiatrist: { bg: "#E8F5E9", text: "#2E7D32", label: "Psychiatrist" },
  researcher: { bg: "#FFF8E1", text: "#F57F17", label: "Researcher" },
};

function formatMemberSince(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(date)
  );
}

function formatRelative(date: Date | null): string {
  if (!date) return "First session";
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 14px",
  borderRadius: 10,
  border: `1.5px solid ${DT.BORDER}`,
  background: DT.WHITE,
  fontSize: 13,
  color: DT.DARK_TEXT,
  outline: "none",
  fontFamily: "'Inter', sans-serif",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: DT.MID_TEXT,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const cardStyle: React.CSSProperties = {
  background: DT.WHITE,
  border: `1px solid ${DT.BORDER}`,
  borderRadius: 16,
  padding: 28,
  marginBottom: 20,
};

export default function ProfilePage() {
  const utils = trpc.useUtils();
  const meQuery = trpc.admin.me.useQuery();

  // Name edit state
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPwError, setCurrentPwError] = useState<string | null>(null);
  const [pwToastVisible, setPwToastVisible] = useState(false);

  const updateName = trpc.adminProfile.updateProfileName.useMutation({
    onSuccess: () => {
      utils.admin.me.invalidate();
      setEditingName(false);
    },
  });

  const changePw = trpc.adminProfile.changePassword.useMutation({
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPwError(null);
      setPwToastVisible(true);
    },
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        setCurrentPwError("Current password is incorrect.");
      } else {
        setCurrentPwError(err.message);
      }
    },
  });

  useEffect(() => {
    if (!pwToastVisible) return;
    const t = setTimeout(() => setPwToastVisible(false), 2000);
    return () => clearTimeout(t);
  }, [pwToastVisible]);

  if (meQuery.isLoading || !meQuery.data) {
    return (
      <div style={{ padding: "0.5rem 0", fontFamily: "'Inter', sans-serif" }}>
        <div className="admin-skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  const me = meQuery.data;
  const initials = me.name.charAt(0).toUpperCase();
  const roleBadge = ROLE_BADGES[me.role] ?? { bg: "#F5F5F5", text: "#666", label: me.role };

  const newPwLength = newPassword.length;
  const newPwValid = newPwLength >= 12 && newPwLength <= 128;
  const confirmMatch = newPassword === confirmPassword;
  const canSubmitPw =
    currentPassword.length > 0 && newPwValid && confirmMatch && !changePw.isPending;

  return (
    <div
      className="admin-fade-in"
      style={{ padding: "0.5rem 0", fontFamily: "'Inter', sans-serif", maxWidth: 720 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: DT.DARK_TEXT,
            margin: 0,
            letterSpacing: "-0.015em",
          }}
        >
          My Profile
        </h1>
        <p style={{ fontSize: 13, color: DT.LIGHT_TEXT, margin: "4px 0 0" }}>
          Manage your account details and password
        </p>
      </div>

      {/* Identity Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Avatar */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${DT.TEAL} 0%, ${DT.TEAL_DARK} 100%)`,
              color: DT.WHITE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          {/* Identity body */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + edit */}
            {editingName ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={100}
                  autoFocus
                  style={{ ...inputStyle, flex: 1, fontSize: 18, fontWeight: 600 }}
                />
                <button
                  onClick={() => updateName.mutate({ name: nameDraft.trim() })}
                  disabled={nameDraft.trim().length === 0 || updateName.isPending}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background:
                      nameDraft.trim().length === 0 || updateName.isPending ? DT.DISABLED : DT.TEAL,
                    color: DT.WHITE,
                    cursor:
                      nameDraft.trim().length === 0 || updateName.isPending
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                  }}
                  aria-label="Save name"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameDraft("");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1.5px solid ${DT.BORDER}`,
                    background: DT.WHITE,
                    color: DT.MID_TEXT,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: DT.DARK_TEXT,
                    margin: 0,
                  }}
                >
                  {me.name}
                </h2>
                <button
                  onClick={() => {
                    setNameDraft(me.name);
                    setEditingName(true);
                  }}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: DT.LIGHT_TEXT,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Edit name"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}

            {/* Email */}
            <div style={{ fontSize: 14, color: DT.LIGHT_TEXT, marginBottom: 12 }}>{me.email}</div>

            {/* Role badge */}
            <div style={{ marginBottom: 14 }}>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: roleBadge.bg,
                  color: roleBadge.text,
                }}
              >
                {roleBadge.label}
              </span>
            </div>

            {/* Meta */}
            <div style={{ display: "flex", gap: 24, fontSize: 12, color: DT.LIGHT_TEXT }}>
              <div>
                <div style={labelStyle}>Member since</div>
                <div style={{ fontSize: 13, color: DT.MID_TEXT, fontWeight: 500 }}>
                  {formatMemberSince(me.createdAt)}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Last login</div>
                <div style={{ fontSize: 13, color: DT.MID_TEXT, fontWeight: 500 }}>
                  {formatRelative(me.lastLoginAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div style={cardStyle}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: DT.DARK_TEXT,
            margin: "0 0 16px",
          }}
        >
          Change Password
        </h2>

        {me.mustChangePassword && (
          <div
            style={{
              background: DT.WARNING_BG,
              border: `1px solid ${DT.WARNING_BORDER}`,
              borderLeft: `4px solid ${DT.WARNING}`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 18,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              color: DT.WARNING,
              fontSize: 13,
            }}
          >
            <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <strong>Password change required.</strong> You are required to change your password
              before continuing.
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmitPw) return;
            setCurrentPwError(null);
            changePw.mutate({ currentPassword, newPassword, confirmPassword });
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setCurrentPwError(null);
              }}
              autoComplete="current-password"
              style={inputStyle}
            />
            {currentPwError && (
              <div style={{ color: DT.RED, fontSize: 12, marginTop: 6 }}>{currentPwError}</div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
            />
            <div
              style={{
                fontSize: 12,
                marginTop: 6,
                color: newPwValid ? DT.GREEN : DT.LIGHT_TEXT,
              }}
            >
              At least 12 characters ({Math.min(newPwLength, 12)}/12)
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
            />
            {confirmPassword.length > 0 && !confirmMatch && (
              <div style={{ color: DT.RED, fontSize: 12, marginTop: 6 }}>
                Passwords do not match.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmitPw}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: canSubmitPw ? DT.TEAL : DT.DISABLED,
              color: DT.WHITE,
              fontWeight: 600,
              fontSize: 13,
              cursor: canSubmitPw ? "pointer" : "not-allowed",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {changePw.isPending ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Toast */}
      {pwToastVisible && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: DT.GREEN_BG,
            color: DT.GREEN,
            border: `1px solid ${DT.GREEN}`,
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 1000,
          }}
        >
          Password updated
        </div>
      )}
    </div>
  );
}
