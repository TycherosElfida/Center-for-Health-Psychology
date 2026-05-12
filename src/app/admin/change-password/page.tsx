"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  Eye,
  EyeOff,
  Check,
  X,
  Key,
  LogOut,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { ChpLogo } from "@/components/ui/ChpLogo";
import { trpc } from "@/lib/trpc/client";

const TEAL = "#9B8EC4";
const TEAL_DARK = "#6B5CA0";
const NAVY = "#030213";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const RED = "#D4183D";
const MUTED = "#717182";
const BORDER = "#E2DCF0";
const WHITE = "#FFFFFF";
const BG = "#F5F3FA";
const SIDEBAR_BG = "#1E1830";

export default function AdminChangePasswordPage() {
  const meQuery = trpc.admin.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const logoutMutation = trpc.admin.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/admin/login";
    },
  });

  const changePasswordMutation = trpc.adminProfile.changePassword.useMutation();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rules = useMemo(
    () => ({
      length: next.length >= 12,
      caseMix: /[a-z]/.test(next) && /[A-Z]/.test(next),
      number: /\d/.test(next),
      symbol: /[^A-Za-z0-9]/.test(next),
      notSameAsCurrent: next.length > 0 && next !== current,
    }),
    [next, current]
  );
  const allRulesPass = Object.values(rules).every(Boolean);
  const matches = next.length > 0 && next === confirm;
  const canSubmit =
    current.length > 0 && allRulesPass && matches && !changePasswordMutation.isPending;

  /* Block accidental navigation away while forced reset is pending */
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (!success) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [success]);

  useEffect(() => {
    if (meQuery.isError || (meQuery.isSuccess && !meQuery.data)) {
      window.location.href = "/admin/login";
    }
  }, [meQuery.isError, meQuery.isSuccess, meQuery.data]);

  useEffect(() => {
    if (meQuery.isSuccess && meQuery.data && !meQuery.data.mustChangePassword) {
      window.location.href = "/admin/dashboard";
    }
  }, [meQuery.isSuccess, meQuery.data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    changePasswordMutation.mutate(
      {
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            window.location.href = "/admin/dashboard";
          }, 1300);
        },
        onError: (err) => {
          setError(err.message);
        },
      }
    );
  };

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  const strength = computeStrength(rules);

  if (meQuery.isLoading || !meQuery.data || !meQuery.data.mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 size={32} style={{ animation: "spin 0.8s linear infinite", color: TEAL_DARK }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const user = meQuery.data;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        fontFamily: "'Inter', sans-serif",
        background: BG,
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{
          background: SIDEBAR_BG,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <ChpLogo size={28} />
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: WHITE,
            }}
          >
            CHP Admin Portal
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={logoutMutation.isPending}
          className="inline-flex items-center gap-1.5"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            cursor: logoutMutation.isPending ? "not-allowed" : "pointer",
            padding: "6px 10px",
            borderRadius: 8,
            transition: "color 0.15s",
            opacity: logoutMutation.isPending ? 0.5 : 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
        >
          {logoutMutation.isPending ? (
            <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
          ) : (
            <LogOut size={13} />
          )}
          Sign out instead
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div style={{ width: "100%", maxWidth: 480 }}>
          {/* Forced reset banner */}
          <div
            className="rounded-xl mb-5"
            style={{
              background: `${AMBER}10`,
              border: `1px solid ${AMBER}40`,
              borderLeft: `4px solid ${AMBER}`,
              padding: "14px 16px",
              display: "flex",
              gap: 12,
            }}
          >
            <ShieldAlert size={20} color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: NAVY,
                }}
              >
                Password change required
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: MUTED,
                  marginTop: 4,
                  lineHeight: 1.55,
                }}
              >
                Your account has been flagged for a required password change. You must set a new
                password to continue using the admin portal.
              </div>
            </div>
          </div>

          {/* Card */}
          <form
            onSubmit={submit}
            style={{
              background: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              boxShadow: "0 4px 14px rgba(3,2,19,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 4,
                background: `linear-gradient(90deg, ${TEAL}, ${TEAL_DARK})`,
              }}
            />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-1">
                <Key size={16} color={TEAL_DARK} />
                <h1
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                    color: NAVY,
                    margin: 0,
                  }}
                >
                  Set a new password
                </h1>
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: MUTED,
                  marginBottom: 18,
                  marginTop: 4,
                }}
              >
                Signed in as <span style={{ color: NAVY, fontWeight: 600 }}>{user.email}</span>.
                Your other active sessions will be signed out after the change.
              </p>

              <Field label="Current password">
                <input
                  type="password"
                  value={current}
                  onChange={(e) => {
                    setCurrent(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  style={inputStyle(error ? RED : undefined)}
                />
                {error && <Inline color={RED}>{error}</Inline>}
              </Field>

              <Field label="New password">
                <div style={{ position: "relative" }}>
                  <input
                    type={showNext ? "text" : "password"}
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 12 characters"
                    style={{ ...inputStyle(), paddingRight: 36 }}
                  />
                  <EyeBtn on={showNext} onClick={() => setShowNext((s) => !s)} />
                </div>
                {next.length > 0 && <StrengthBar strength={strength} />}
              </Field>

              <Field label="Confirm new password">
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    style={{
                      ...inputStyle(confirm.length > 0 && !matches ? RED : undefined),
                      paddingRight: 36,
                    }}
                  />
                  <EyeBtn on={showConfirm} onClick={() => setShowConfirm((s) => !s)} />
                </div>
                {confirm.length > 0 && !matches && (
                  <Inline color={RED}>Passwords do not match</Inline>
                )}
                {confirm.length > 0 && matches && <Inline color={GREEN}>Passwords match</Inline>}
              </Field>

              <div
                className="rounded-lg"
                style={{
                  background: BG,
                  border: `1px solid ${BORDER}`,
                  padding: "10px 12px",
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: MUTED,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    marginBottom: 6,
                  }}
                >
                  Password requirements
                </div>
                <RuleRow ok={rules.length} text="At least 12 characters" />
                <RuleRow ok={rules.caseMix} text="Contains uppercase and lowercase" />
                <RuleRow ok={rules.number} text="Contains a number" />
                <RuleRow ok={rules.symbol} text="Contains a symbol" />
                <RuleRow ok={rules.notSameAsCurrent} text="Different from current password" />
              </div>
            </div>

            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                background: BG,
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <span style={{ fontSize: 11.5, color: MUTED }}>
                Other sessions will be signed out automatically.
              </span>
              <button
                type="submit"
                disabled={!canSubmit && !success}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: success
                    ? GREEN
                    : canSubmit
                      ? `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`
                      : BORDER,
                  color: WHITE,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: canSubmit || success ? "pointer" : "not-allowed",
                  boxShadow: canSubmit ? `0 4px 12px ${TEAL}40` : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: !canSubmit && !success ? 0.7 : 1,
                  transition: "all 0.15s",
                }}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                    Updating…
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 size={14} />
                    Password updated
                  </>
                ) : (
                  "Update password"
                )}
              </button>
            </div>
          </form>

          <p
            style={{
              fontSize: 11.5,
              color: MUTED,
              marginTop: 16,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Forgot your current password? Contact a Super Admin to initiate a recovery — for
            security, we do not allow self-service recovery from this page.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ─────────── helpers ─────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: NAVY,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Inline({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color, marginTop: 6 }}>{children}</div>;
}

function RuleRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        fontSize: 12,
        padding: "2px 0",
      }}
    >
      {ok ? (
        <Check size={13} color={GREEN} />
      ) : (
        <X size={13} color={MUTED} style={{ opacity: 0.6 }} />
      )}
      <span style={{ color: ok ? NAVY : MUTED }}>{text}</span>
    </div>
  );
}

function EyeBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={-1}
      style={{
        position: "absolute",
        right: 8,
        top: "50%",
        transform: "translateY(-50%)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: MUTED,
        padding: 4,
        display: "flex",
      }}
    >
      {on ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}

function computeStrength(r: {
  length: boolean;
  caseMix: boolean;
  number: boolean;
  symbol: boolean;
  notSameAsCurrent: boolean;
}) {
  const score = Number(r.length) + Number(r.caseMix) + Number(r.number) + Number(r.symbol);
  if (score <= 1) return { label: "Weak", color: RED, pct: 25 };
  if (score === 2) return { label: "Fair", color: AMBER, pct: 50 };
  if (score === 3) return { label: "Good", color: TEAL_DARK, pct: 75 };
  return { label: "Strong", color: GREEN, pct: 100 };
}

function StrengthBar({ strength }: { strength: { label: string; color: string; pct: number } }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 999,
          background: BORDER,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${strength.pct}%`,
            background: strength.color,
            transition: "width 0.2s, background 0.2s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: strength.color,
          minWidth: 42,
          textAlign: "right",
        }}
      >
        {strength.label}
      </span>
    </div>
  );
}

const inputStyle = (errColor?: string): React.CSSProperties => ({
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: `1px solid ${errColor || BORDER}`,
  background: WHITE,
  color: NAVY,
  fontSize: 13,
  outline: "none",
  fontFamily: "'Inter', sans-serif",
  transition: "border-color 0.15s",
});
