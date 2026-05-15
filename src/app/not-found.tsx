/**
 * Global 404 — Not Found page.
 *
 * Server component. Shown when a URL doesn't match any route or when
 * a page calls `notFound()`.
 */

import Link from "next/link";
import { Home, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      {/* Decorative background gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, var(--brand-primary-light, #EDE9F8), transparent)",
        }}
      />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Large 404 */}
        <p
          className="mb-2 font-heading text-[96px] font-extrabold leading-none tracking-tighter"
          style={{
            color: "var(--brand-primary-mid, #C5BADF)",
            textShadow: "0 4px 24px rgba(155, 142, 196, 0.15)",
          }}
        >
          404
        </p>

        {/* Title */}
        <h1
          className="mb-3 font-heading text-2xl font-extrabold tracking-tight"
          style={{ color: "var(--text-heading, #1A202C)" }}
        >
          Halaman Tidak Ditemukan
        </h1>

        {/* Subtitle */}
        <p
          className="mb-8 text-[15px] leading-relaxed"
          style={{ color: "var(--text-muted, #718096)" }}
        >
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan. Mari kembali ke jalur yang
          benar.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white no-underline transition-all hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))",
              boxShadow: "var(--shadow-button)",
            }}
          >
            <Home size={15} />
            Kembali ke Beranda
          </Link>

          <Link
            href="/tests"
            className="flex items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold no-underline transition-all hover:shadow-sm"
            style={{
              borderColor: "var(--brand-primary-mid, #C5BADF)",
              color: "var(--brand-primary-dark, #6B5CA0)",
              background: "white",
            }}
          >
            <BookOpen size={15} />
            Jelajahi Asesmen
          </Link>
        </div>
      </div>
    </div>
  );
}
