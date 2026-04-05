"use client";

/**
 * SignupForm — Client component for user registration
 *
 * Uses react-hook-form + zod for client validation including:
 * - Name (min 2 chars)
 * - Email
 * - Password (min 8 chars) with strength meter
 * - Confirm password (must match)
 * - Privacy consent checkbox
 *
 * Submits via server action (signupAction) that:
 * - Checks email uniqueness
 * - Hashes password with bcrypt
 * - Inserts user
 * - Auto-signs in via Auth.js
 *
 * All labels and messages are in Bahasa Indonesia.
 */
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { ChpLogo } from "@/components/ui/ChpLogo";
import { signupAction } from "@/actions/auth";
import Link from "next/link";

const signupSchema = z
  .object({
    name: z.string().min(2, { message: "Nama minimal 2 karakter" }),
    email: z.string().email({ message: "Format email tidak valid" }),
    password: z.string().min(8, { message: "Password minimal 8 karakter" }),
    confirmPassword: z.string(),
    consent: z.boolean().refine((v) => v === true, {
      message: "Persetujuan diperlukan",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

function getStrength(v: string): number {
  let pts = 0;
  if (v.length >= 8) pts++;
  if (/[0-9]/.test(v)) pts++;
  if (/[A-Z]/.test(v)) pts++;
  if (/[^a-zA-Z0-9]/.test(v)) pts++;
  return pts;
}

const STRENGTH_LABELS = ["", "Lemah", "Sedang", "Kuat", "Kuat"];
const STRENGTH_COLORS = ["", "#E24B4A", "#EF9F27", "#639922", "#639922"];
const STRENGTH_WIDTHS = [0, 33, 60, 80, 100];

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", consent: false },
  });

  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  const strength = getStrength(passwordValue);

  async function onSubmit(data: SignupFormData) {
    setServerError(null);

    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("email", data.email);
    formData.set("password", data.password);

    const result = await signupAction(formData);
    if (result?.error) {
      setServerError(result.error);
    }
    // On success, signupAction redirects via server-side
  }

  const inputClasses =
    "w-full px-4 py-3 rounded-xl text-sm bg-white transition-all duration-200 placeholder:text-[var(--text-muted)] focus-visible:outline-none";

  function inputStyle(hasError: boolean) {
    return {
      border: `1px solid ${hasError ? "#E24B4A" : "var(--border-input)"}`,
      color: "var(--text-body)",
    } as const;
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "var(--brand-primary)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,142,196,0.3)";
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>, hasError: boolean) {
    e.currentTarget.style.borderColor = hasError ? "#E24B4A" : "var(--border-input)";
    e.currentTarget.style.boxShadow = "none";
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
    >
      {/* Back link */}
      <Link
        href="/"
        className="flex items-center gap-1 mb-8 text-xs transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} />
        Kembali ke Beranda
      </Link>

      {/* Logo */}
      <ChpLogo size={44} className="mb-6" />

      {/* Title */}
      <h1
        className="text-[28px] font-semibold mb-1.5"
        style={{
          fontFamily: "var(--font-outfit), Outfit, sans-serif",
          color: "var(--text-heading)",
        }}
      >
        Buat Akun CHP
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Simpan hasil assessmentmu dan pantau perkembanganmu.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Name field */}
        <div>
          <label
            htmlFor="signup-name"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: "var(--text-muted)" }}
          >
            Nama Lengkap
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Nama kamu"
            {...register("name")}
            className={inputClasses}
            style={inputStyle(!!errors.name)}
            onFocus={handleFocus}
            onBlur={(e) => handleBlur(e, !!errors.name)}
          />
          {errors.name && (
            <p role="alert" className="text-xs mt-1.5 text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email field */}
        <div>
          <label
            htmlFor="signup-email"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: "var(--text-muted)" }}
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            {...register("email")}
            className={inputClasses}
            style={inputStyle(!!errors.email)}
            onFocus={handleFocus}
            onBlur={(e) => handleBlur(e, !!errors.email)}
          />
          {errors.email && (
            <p role="alert" className="text-xs mt-1.5 text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label
            htmlFor="signup-password"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: "var(--text-muted)" }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              {...register("password")}
              className={`${inputClasses} pr-12`}
              style={inputStyle(!!errors.password)}
              onFocus={handleFocus}
              onBlur={(e) => handleBlur(e, !!errors.password)}
            />
            <button
              type="button"
              tabIndex={0}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="text-xs mt-1.5 text-red-600">
              {errors.password.message}
            </p>
          )}

          {/* Password strength meter */}
          {passwordValue.length > 0 && (
            <div className="mt-2">
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--border-subtle)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  animate={{
                    width: `${STRENGTH_WIDTHS[strength]}%`,
                    backgroundColor: STRENGTH_COLORS[strength] || "#9B8EC4",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {strength > 0 && (
                <span className="text-xs mt-1 block" style={{ color: STRENGTH_COLORS[strength] }}>
                  {STRENGTH_LABELS[strength]}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="signup-confirm-password"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: "var(--text-muted)" }}
          >
            Konfirmasi Password
          </label>
          <input
            id="signup-confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ulangi password"
            {...register("confirmPassword")}
            className={inputClasses}
            style={inputStyle(!!errors.confirmPassword)}
            onFocus={handleFocus}
            onBlur={(e) => handleBlur(e, !!errors.confirmPassword)}
          />
          {errors.confirmPassword && (
            <p role="alert" className="text-xs mt-1.5 text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Consent checkbox */}
        <div className="flex items-start gap-2.5 mt-2">
          <input
            type="checkbox"
            id="signup-consent"
            {...register("consent")}
            className="mt-0.5 w-4 h-4 rounded cursor-pointer accent-[var(--brand-primary)]"
            style={{ borderColor: "var(--border-input)" }}
          />
          <label
            htmlFor="signup-consent"
            className="text-xs leading-relaxed cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            Dengan mendaftar, kamu menyetujui{" "}
            <a
              href="/privacy"
              className="hover:underline"
              style={{ color: "var(--brand-primary)" }}
            >
              Kebijakan Privasi
            </a>{" "}
            kami.
          </label>
        </div>
        {errors.consent && (
          <p role="alert" className="text-xs text-red-600 -mt-2">
            {errors.consent.message}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
          style={{ backgroundColor: "var(--brand-primary)" }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = "var(--brand-primary-dark)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--brand-primary)";
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Memproses...
            </>
          ) : (
            "Daftar"
          )}
        </button>

        {/* Server error banner */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm overflow-hidden"
            >
              <AlertCircle size={15} className="shrink-0" />
              {serverError}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Footer link */}
      <p className="text-sm mt-8 text-center" style={{ color: "var(--text-muted)" }}>
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium transition-colors hover:underline"
          style={{ color: "var(--brand-primary)" }}
        >
          Masuk
        </Link>
      </p>
    </motion.div>
  );
}
