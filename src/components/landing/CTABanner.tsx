/**
 * CTABanner — Gradient call-to-action banner for the homepage bottom.
 * Server Component — no interactivity.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChpLogo } from "@/components/ui/ChpLogo";

export function CTABanner() {
  return (
    <section className="px-6 pb-20">
      <div
        className="mx-auto max-w-4xl rounded-3xl p-8 text-center sm:p-12"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-primary-dark, #6B5CA0) 0%, var(--brand-primary, #9B8EC4) 50%, var(--brand-secondary, #B3A8D4) 100%)",
          boxShadow: "var(--shadow-cta)",
        }}
      >
        <ChpLogo size={40} className="mx-auto mb-4" />
        <h2
          className="mb-3 font-heading font-extrabold text-white"
          style={{ fontSize: "clamp(22px, 3vw, 32px)" }}
        >
          Ready to begin your journey?
        </h2>
        <p className="mb-7 text-[15px]" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
          Your mental health matters. Take the first step toward understanding yourself better.
        </p>
        <Link
          href="/tests"
          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-bold no-underline transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            color: "var(--brand-primary-dark, #6B5CA0)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          Get Started <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
