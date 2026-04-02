/**
 * AboutPreview — Homepage "Who We Are" section.
 *
 * 2-column layout: Text content with pillar cards (left)
 * + decorative orbit illustration (right).
 */

import Link from "next/link";
import { Microscope, BookOpen, Leaf, Brain, Shield, Users, ArrowRight } from "lucide-react";
import { ChpLogo } from "@/components/ui/ChpLogo";

const PILLARS = [
  {
    icon: Microscope,
    label: "Evidence-Based Research",
    desc: "Grounded in peer-reviewed science",
  },
  {
    icon: BookOpen,
    label: "Mental Health Education",
    desc: "Promoting awareness and literacy",
  },
  {
    icon: Leaf,
    label: "Holistic Well-being",
    desc: "Mind-body health in harmony",
  },
] as const;

const SATELLITES = [
  { icon: Brain, label: "Psychology", position: "top-[6%] left-1/2 -translate-x-1/2" },
  { icon: Shield, label: "Safety", position: "top-[30%] right-[4%]" },
  { icon: Users, label: "Community", position: "bottom-[6%] left-1/2 -translate-x-1/2" },
  { icon: Microscope, label: "Research", position: "top-[30%] left-[4%]" },
] as const;

export function AboutPreview() {
  return (
    <section
      className="px-6 py-20"
      style={{
        background: "linear-gradient(160deg, var(--surface-subtle, #F5F3FA) 0%, #FFFFFF 100%)",
      }}
    >
      <div className="mx-auto grid max-w-[960px] grid-cols-1 items-center gap-16 md:grid-cols-2">
        {/* ── Text column ── */}
        <div>
          <span
            className="mb-3.5 block text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--brand-primary, #9B8EC4)" }}
          >
            Who We Are
          </span>

          <h2
            className="font-heading font-extrabold leading-[1.2] tracking-tight"
            style={{
              fontSize: "clamp(26px, 3.5vw, 40px)",
              color: "var(--text-heading, #1A202C)",
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            About{" "}
            <span style={{ color: "var(--brand-primary-dark, #6B5CA0)" }}>
              Center for Health Psychology
            </span>
          </h2>

          <p
            className="mb-4 text-[15px] leading-[1.85]"
            style={{ color: "var(--text-body, #4A5568)" }}
          >
            <strong style={{ color: "var(--text-heading, #1A202C)" }}>
              The Center for Health Psychology (CHP)
            </strong>{" "}
            di UKRIDA berdedikasi untuk memajukan penelitian dan intervensi psikologis yang
            mendorong kesehatan dan kesejahteraan holistik. Dengan fondasi yang kuat dalam psikologi
            kesehatan, CHP mengintegrasikan temuan penelitian terbaru dengan inisiatif praktis untuk
            mengatasi tantangan kesehatan mental dan fisik di masyarakat.
          </p>

          <p
            className="mb-7 text-[15px] leading-[1.85]"
            style={{ color: "var(--text-body, #4A5568)" }}
          >
            CHP berfokus pada promosi kesehatan, intervensi dini, dan strategi pencegahan untuk
            meningkatkan hasil kesehatan mental baik di tingkat individu maupun komunitas. Melalui
            penelitian kolaboratif dan kemitraan interdisipliner, CHP bertujuan untuk menciptakan
            masyarakat yang lebih sehat.
          </p>

          {/* Pillar items */}
          <div className="mb-8 flex flex-col gap-3">
            {PILLARS.map((pillar) => {
              const PillarIcon = pillar.icon;
              return (
                <div key={pillar.label} className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(155, 142, 196, 0.09)" }}
                  >
                    <PillarIcon
                      size={17}
                      color="var(--brand-primary-dark, #6B5CA0)"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--text-heading, #1A202C)" }}
                    >
                      {pillar.label}
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--text-muted, #718096)" }}>
                      {pillar.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold no-underline transition-colors"
            style={{
              background: "rgba(155, 142, 196, 0.08)",
              color: "var(--brand-primary-dark, #6B5CA0)",
              border: "1.5px solid rgba(155, 142, 196, 0.19)",
            }}
          >
            Learn More About Us <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {/* ── Orbit illustration ── */}
        <div className="relative flex items-center justify-center" style={{ minHeight: 380 }}>
          {/* Background radial glow */}
          <div
            className="absolute h-80 w-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(155,142,196,0.07) 0%, rgba(155,142,196,0.02) 70%, transparent 100%)",
            }}
          />
          {/* Dashed orbit ring */}
          <div
            className="absolute h-[300px] w-[300px] rounded-full"
            style={{
              border: "1.5px dashed rgba(155, 142, 196, 0.15)",
            }}
          />

          {/* Center logo */}
          <div
            className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-white"
            style={{
              boxShadow: "0 12px 40px rgba(155, 142, 196, 0.22)",
              border: "2px solid rgba(155, 142, 196, 0.15)",
            }}
          >
            <ChpLogo size={64} />
          </div>

          {/* Satellite icons */}
          {SATELLITES.map((sat) => {
            const SatIcon = sat.icon;
            return (
              <div
                key={sat.label}
                className={`absolute flex flex-col items-center gap-1 ${sat.position}`}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white"
                  style={{
                    border: "1.5px solid rgba(155, 142, 196, 0.19)",
                    boxShadow: "0 4px 16px rgba(155, 142, 196, 0.12)",
                  }}
                >
                  <SatIcon size={22} color="var(--brand-primary, #9B8EC4)" aria-hidden="true" />
                </div>
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: "var(--brand-primary, #9B8EC4)" }}
                >
                  {sat.label}
                </span>
              </div>
            );
          })}

          {/* Tagline badge */}
          <div
            className="absolute bottom-6 right-4 max-w-[170px] rounded-xl bg-white px-3.5 py-2"
            style={{
              border: "1px solid rgba(155, 142, 196, 0.12)",
              boxShadow: "0 4px 16px rgba(155, 142, 196, 0.09)",
            }}
          >
            <div
              className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: "var(--brand-primary, #9B8EC4)" }}
            >
              Our Tagline
            </div>
            <div
              className="font-heading text-[12px] font-bold italic"
              style={{ color: "var(--text-heading, #1A202C)" }}
            >
              &quot;Nurturing Healthy Minds &amp; Bodies&quot;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
