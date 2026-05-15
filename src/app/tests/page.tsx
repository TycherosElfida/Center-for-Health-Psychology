import type { Metadata } from "next";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { AssessmentCatalog } from "@/components/tests/AssessmentCatalog";

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
          <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15] tracking-tight text-foreground">
            Instrumen Asesmen
          </h1>

          <p className="mx-auto mt-3 max-w-[520px] text-base leading-relaxed text-muted-foreground">
            Jelajahi koleksi instrumen psikologi tervalidasi kami. Setiap asesmen didukung oleh
            penelitian yang telah dikaji sejawat dan penilaian terstandarisasi.
          </p>
        </div>
      </section>

      {/* ── Interactive Catalog (Client Boundary) ── */}
      <AssessmentCatalog />

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card py-6 text-center text-[13px] text-muted-foreground">
        © 2026 Center for Health Psychology · Hanya untuk keperluan edukasi &amp; skrining
      </footer>
    </div>
  );
}
