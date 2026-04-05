"use client";

/**
 * LoginForm — Client component for email/password authentication
 *
 * Integrates with Auth.js v5 signIn (credentials provider).
 * Uses react-hook-form + zod for client-side validation.
 * All labels and messages are in Bahasa Indonesia.
 *
 * Features:
 * - Password show/hide toggle with accessible aria-labels
 * - Animated error banner via AnimatePresence
 * - Loading spinner state on submit
 * - Form entrance animation via motion.div
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { ChpLogo } from "@/components/ui/ChpLogo";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(8, { message: "Password minimal 8 karakter" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Email atau password salah. Coba lagi.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Terjadi kesalahan. Silakan coba lagi.");
    }
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
        Masuk ke CHP
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Akses hasil assessmentmu dan lacak perkembanganmu.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email field */}
        <div>
          <label
            htmlFor="login-email"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: "var(--text-muted)" }}
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            {...register("email")}
            className="w-full px-4 py-3 rounded-xl text-sm bg-white transition-all duration-200 placeholder:text-[var(--text-muted)] focus-visible:outline-none"
            style={{
              border: `1px solid ${errors.email ? "#E24B4A" : "var(--border-input)"}`,
              color: "var(--text-body)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--brand-primary)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,142,196,0.3)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.email ? "#E24B4A" : "var(--border-input)";
              e.currentTarget.style.boxShadow = "none";
            }}
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
            htmlFor="login-password"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: "var(--text-muted)" }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className="w-full px-4 py-3 pr-12 rounded-xl text-sm bg-white transition-all duration-200 placeholder:text-[var(--text-muted)] focus-visible:outline-none"
              style={{
                border: `1px solid ${errors.password ? "#E24B4A" : "var(--border-input)"}`,
                color: "var(--text-body)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,142,196,0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.password
                  ? "#E24B4A"
                  : "var(--border-input)";
                e.currentTarget.style.boxShadow = "none";
              }}
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
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
          style={{
            backgroundColor: "var(--brand-primary)",
          }}
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
            "Masuk"
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
        Belum punya akun?{" "}
        <Link
          href="/signup"
          className="font-medium transition-colors hover:underline"
          style={{ color: "var(--brand-primary)" }}
        >
          Daftar sekarang
        </Link>
      </p>
    </motion.div>
  );
}
