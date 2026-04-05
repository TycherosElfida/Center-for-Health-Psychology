import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";

import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { AssessmentCatalog } from "@/components/tests/AssessmentCatalog";
import { TESTS } from "@/lib/data/tests";

/* ═══════════════════════════════════════════════════════
   SEO Metadata — statically generated (server component)
   ═══════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Assessment Instruments | Center for Health Psychology",
  description:
    "Browse our curated collection of validated psychological instruments. Each assessment is backed by peer-reviewed research and standardized scoring.",
  openGraph: {
    title: "Assessment Instruments | CHP",
    description: "Evidence-based psychological assessments with psychometric validation.",
  },
};

/* ═══════════════════════════════════════════════════════
   Page — Server Component shell + Client catalog
   ═══════════════════════════════════════════════════════

   Architectural decision: The page itself is a Server Component
   so that Next.js can statically export the hero markup and SEO
   metadata.  The interactive catalog (search, filter, sort, view
   toggle) lives inside <AssessmentCatalog />, which is marked
   "use client".
   ═══════════════════════════════════════════════════════ */

export default function TestsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavbarWrapper />

      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-secondary via-secondary/60 to-background px-4 pb-12 pt-14 text-center sm:px-6">
        <div className="mx-auto max-w-[680px]">
          {/* Pill badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5">
            <FlaskConical size={14} className="text-primary" />
            <span className="text-[13px] font-semibold text-primary">
              {TESTS.length} Evidence-Based Instruments
            </span>
          </div>

          <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15] tracking-tight text-foreground">
            Assessment Instruments
          </h1>

          <p className="mx-auto mt-3 max-w-[520px] text-base leading-relaxed text-muted-foreground">
            Browse our curated collection of validated psychological instruments. Each assessment is
            backed by peer-reviewed research and standardized scoring.
          </p>
        </div>
      </section>

      {/* ── Interactive Catalog (Client Boundary) ── */}
      <AssessmentCatalog />

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card py-6 text-center text-[13px] text-muted-foreground">
        © 2026 Center for Health Psychology · For educational &amp; screening purposes only
      </footer>
    </div>
  );
}
