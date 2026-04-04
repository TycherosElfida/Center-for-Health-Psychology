/**
 * CHP Platform — 401 Unauthorized Error Page (Next.js 16)
 *
 * Rendered when an unauthenticated user attempts to access a
 * protected route. Next.js 16 file convention: unauthorized.tsx
 * at the app root catches all unauthorized() calls.
 */
import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--surface-subtle)]">
      <div className="text-center max-w-md px-6">
        <p className="text-6xl font-heading font-bold text-[var(--brand-primary)] mb-4">401</p>
        <h1 className="text-xl font-heading font-semibold text-[var(--text-heading)] mb-2">
          Autentikasi Diperlukan
        </h1>
        <p className="text-[var(--text-body)] mb-6">
          Kamu harus masuk untuk mengakses halaman ini.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-medium hover:bg-[var(--brand-primary-dark)] transition-colors"
        >
          Masuk
        </Link>
      </div>
    </main>
  );
}
