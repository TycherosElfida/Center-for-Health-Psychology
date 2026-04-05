import type { Metadata } from "next";

import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { HeroSection } from "@/components/landing/Hero";
import { AboutPreview } from "@/components/landing/AboutPreview";
import { TestCardGrid } from "@/components/landing/TestCatalogPreview";
import { FAQSection } from "@/components/landing/FAQ";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";
import { MotionSection } from "@/lib/motion";

/* ═══════════════════════════════════════════════════════
   SEO Metadata
   ═══════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Center for Health Psychology — Evidence-Based Assessments",
  description:
    "Take validated psychological assessments designed to help you gain deeper insight into your personality, stress levels, and mental health.",
  openGraph: {
    title: "Center for Health Psychology",
    description:
      "Evidence-based psychological assessments for self-discovery and mental health screening.",
  },
};

/* ═══════════════════════════════════════════════════════
   Page Component (Server Component)
   ═══════════════════════════════════════════════════════ */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <NavbarWrapper />

      <main>
        <HeroSection />

        <MotionSection>
          <AboutPreview />
        </MotionSection>

        <MotionSection delay={0.1}>
          <TestCardGrid />
        </MotionSection>

        <MotionSection delay={0.15}>
          <FAQSection />
        </MotionSection>

        <MotionSection delay={0.2}>
          <CTABanner />
        </MotionSection>
      </main>

      <Footer />
    </div>
  );
}
