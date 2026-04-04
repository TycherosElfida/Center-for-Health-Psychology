/**
 * CHP Platform — 403 Forbidden Error Page (Next.js 16)
 *
 * Rendered when an authenticated user attempts to access a route
 * they don't have permission for. Next.js 16 file convention:
 * forbidden.tsx at the app root catches all forbidden() calls.
 */
import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--surface-subtle)]">
      <div className="text-center max-w-md px-6">
        <p className="text-6xl font-heading font-bold text-[var(--brand-primary-dark)] mb-4">403</p>
        <h1 className="text-xl font-heading font-semibold text-[var(--text-heading)] mb-2">
          Akses Ditolak
        </h1>
        <p className="text-[var(--text-body)] mb-6">Kamu tidak memiliki akses ke halaman ini.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-medium hover:bg-[var(--brand-primary-dark)] transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
