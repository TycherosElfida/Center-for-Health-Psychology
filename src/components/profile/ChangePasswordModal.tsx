"use client";

/**
 * ChangePasswordModal — modal dialog for updating the user's password.
 *
 * Design matches the Figma spec:
 *   - Header: key icon + "Change Password" title + X close button
 *   - Subtitle: "Update your account password. You'll stay signed in on this device."
 *   - Three password fields: Current / New / Confirm new
 *   - Each field has a show/hide eye-toggle
 *   - Password strength meter (below new password field)
 *   - Footer: Cancel + Update Password (disabled until form is valid)
 *
 * Calls: trpc.profile.changePassword mutation
 */

import { useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, KeyRound, X, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

/* ═══════════════════════════════════════════════════════
   Schema
   ═══════════════════════════════════════════════════════ */

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Masukkan password saat ini"),
    newPassword: z.string().min(8, "Minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password baru"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

/* ═══════════════════════════════════════════════════════
   Password strength helpers
   ═══════════════════════════════════════════════════════ */

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function computeStrength(pwd: string): StrengthLevel {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(4, score) as StrengthLevel;
}

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  0: "",
  1: "Lemah",
  2: "Cukup",
  3: "Kuat",
  4: "Sangat Kuat",
};

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  0: "transparent",
  1: "#FC8181",
  2: "#F6AD55",
  3: "#68D391",
  4: "#48BB78",
};

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordVal = useWatch({ control, name: "newPassword" }) as string;
  const strength = computeStrength(newPasswordVal ?? "");

  const changeMutation = trpc.profile.changePassword.useMutation({
    onSuccess: () => {
      setSucceeded(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    },
    onError: (err) => {
      if (err.message.includes("incorrect")) {
        setError("currentPassword", { message: "Password saat ini salah" });
      } else {
        setError("currentPassword", { message: err.message });
      }
    },
  });

  const handleClose = useCallback(() => {
    reset();
    setSucceeded(false);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  }, [reset, onClose]);

  const onSubmit = useCallback(
    (values: ChangePasswordValues) => {
      changeMutation.mutate({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    },
    [changeMutation]
  );

  if (!isOpen) return null;

  const accentColor = "var(--brand-primary, #9B8EC4)";
  const accentDark = "var(--brand-primary-dark, #6B5CA0)";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(30,20,60,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ border: "1px solid var(--border-subtle, #E2DCF0)" }}
      >
        {/* Top accent bar */}
        <div
          className="h-[3px]"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, ${accentDark})`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0ECF9] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <KeyRound size={20} style={{ color: accentColor }} />
            <h2
              className="font-heading text-[18px] font-bold"
              style={{ color: "var(--text-heading, #1A1240)" }}
            >
              Change Password
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#F5F3FF]"
            aria-label="Close"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {succeeded ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background: "color-mix(in oklch, #48BB78 12%, transparent)",
                  border: "1.5px solid color-mix(in oklch, #48BB78 40%, transparent)",
                }}
              >
                <CheckCircle2 size={26} style={{ color: "#48BB78" }} />
              </div>
              <p className="font-heading text-[15px] font-bold text-foreground">
                Password Berhasil Diubah!
              </p>
              <p className="text-[13px] text-muted-foreground">
                Password akun Anda telah diperbarui. Anda tetap masuk di perangkat ini.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-[13px] leading-relaxed text-muted-foreground">
                Update your account password. You&apos;ll stay signed in on this device.
              </p>

              <form
                id="change-password-form"
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
                noValidate
              >
                {/* ── Current password ── */}
                <PasswordField
                  id="currentPassword"
                  label="Current password"
                  show={showCurrent}
                  onToggleShow={() => setShowCurrent((v) => !v)}
                  registration={register("currentPassword")}
                  error={errors.currentPassword?.message}
                  accentColor={accentColor}
                />

                {/* ── New password + strength meter ── */}
                <div>
                  <PasswordField
                    id="newPassword"
                    label="New password"
                    placeholder="At least 8 characters"
                    show={showNew}
                    onToggleShow={() => setShowNew((v) => !v)}
                    registration={register("newPassword")}
                    error={errors.newPassword?.message}
                    accentColor={accentColor}
                  />

                  {/* Strength meter */}
                  {newPasswordVal && (
                    <div className="mt-2.5">
                      <div className="flex gap-1">
                        {([1, 2, 3, 4] as StrengthLevel[]).map((level) => (
                          <div
                            key={level}
                            className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background: strength >= level ? STRENGTH_COLORS[strength] : "#E2DCF0",
                            }}
                          />
                        ))}
                      </div>
                      {strength > 0 && (
                        <p
                          className="mt-1 text-right text-[11px] font-semibold transition-colors"
                          style={{ color: STRENGTH_COLORS[strength] }}
                        >
                          {STRENGTH_LABELS[strength]}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Confirm new password ── */}
                <PasswordField
                  id="confirmPassword"
                  label="Confirm new password"
                  placeholder="Re-enter new password"
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm((v) => !v)}
                  registration={register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                  accentColor={accentColor}
                />
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        {!succeeded && (
          <div
            className="flex items-center justify-end gap-3 border-t px-6 py-4"
            style={{
              borderColor: "#F0ECF9",
              background: "var(--brand-primary-light, #F5F3FF)",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white"
              style={{ borderColor: "#D6CEED" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="change-password-form"
              disabled={!isValid || isSubmitting}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: isValid
                  ? `linear-gradient(135deg, ${accentColor}, ${accentDark})`
                  : "#C5BADF",
                boxShadow: isValid ? `0 4px 16px rgba(155,142,196,0.35)` : "none",
                cursor: isValid && !isSubmitting ? "pointer" : "not-allowed",
              }}
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PasswordField — reusable input with show/hide toggle
   ═══════════════════════════════════════════════════════ */

function PasswordField({
  id,
  label,
  placeholder,
  show,
  onToggleShow,
  registration,
  error,
  accentColor,
}: {
  id: string;
  label: string;
  placeholder?: string;
  show: boolean;
  onToggleShow: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
  error?: string;
  accentColor: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-[13px] font-semibold"
        style={{ color: "var(--text-body, #4A5568)" }}
      >
        <Lock size={13} style={{ color: accentColor }} />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
          {...registration}
          className="w-full rounded-xl border py-3 pl-4 pr-11 text-sm text-foreground outline-none transition-all"
          style={{
            borderColor: error ? "#FC8181" : "var(--border-input, #E2DCF0)",
            background: error ? "#FFF5F5" : "white",
          }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
