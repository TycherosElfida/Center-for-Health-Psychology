"use client";

/**
 * Assessment Flow Error Boundary — scoped to /test/[slug]/* routes.
 *
 * Shows a context-specific message about potential data loss during
 * the assessment, with a link back to the assessment catalog.
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, BookOpen } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TestError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[CHP] Assessment flow error:", error);
  }, [error]);

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
        {/* Icon */}
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background: "color-mix(in oklch, #F6AD55 10%, var(--brand-primary-light, #EDE9F8))",
            border:
              "1.5px solid color-mix(in oklch, #F6AD55 30%, var(--brand-primary-mid, #C5BADF))",
            boxShadow: "0 8px 32px rgba(246, 173, 85, 0.1)",
          }}
        >
          <AlertTriangle size={36} style={{ color: "#DD6B20" }} />
        </div>

        {/* Title */}
        <h1
          className="mb-3 font-heading text-2xl font-extrabold tracking-tight"
          style={{ color: "var(--text-heading, #1A202C)" }}
        >
          Kesalahan Asesmen
        </h1>

        {/* Subtitle */}
        <p
          className="mb-8 text-[15px] leading-relaxed"
          style={{ color: "var(--text-muted, #718096)" }}
        >
          Terjadi kesalahan saat mengerjakan asesmen. Progres Anda mungkin belum tersimpan. Anda
          dapat mencoba lagi atau kembali ke katalog asesmen.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))",
              boxShadow: "var(--shadow-button)",
            }}
          >
            <RotateCcw size={15} />
            Coba Lagi
          </button>

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

        {/* Error digest */}
        {error.digest && (
          <p
            className="mt-8 text-[11px]"
            style={{ color: "var(--text-muted, #718096)", opacity: 0.6 }}
          >
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
