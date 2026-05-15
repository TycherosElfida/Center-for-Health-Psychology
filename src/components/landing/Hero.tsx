"use client";

/**
 * HeroSection — Landing page hero with gradient background,
 * headline, CTA buttons, and stats bar.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section
      className="px-6 pb-24 pt-20"
      style={{
        background:
          "linear-gradient(160deg, var(--brand-primary-light, #EDE9F8) 0%, #F8F6FD 50%, #FFFFFF 100%)",
      }}
    >
      <div className="mx-auto max-w-[700px] text-center">
        {/* Pill badge */}
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{
            background: "rgba(155, 142, 196, 0.09)",
            border: "1px solid rgba(155, 142, 196, 0.21)",
            color: "var(--brand-primary-dark, #6B5CA0)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Asesmen Psikologi Berbasis Bukti Ilmiah
        </div>

        {/* Headline */}
        <h1
          className="font-heading font-extrabold leading-[1.15] tracking-tight"
          style={{
            fontSize: "clamp(32px, 5vw, 54px)",
            color: "var(--text-heading, #1A202C)",
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}
        >
          Nurturing Healthy{" "}
          <span style={{ color: "var(--brand-primary-dark, #6B5CA0)" }}>Minds and Bodies</span>
        </h1>

        {/* Sub-copy */}
        <p
          className="mx-auto mb-9 max-w-[560px]"
          style={{
            fontSize: 17,
            color: "var(--text-body, #4A5568)",
            lineHeight: 1.75,
          }}
        >
          Ikuti asesmen psikologi yang tervalidasi untuk membantu Anda memahami lebih dalam tentang
          kepribadian, tingkat stres, dan kesehatan mental Anda hanya dalam beberapa menit.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold text-white no-underline transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))",
              boxShadow: "var(--shadow-button)",
            }}
          >
            Jelajahi Asesmen <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
