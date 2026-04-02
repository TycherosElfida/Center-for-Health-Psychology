"use client";

/**
 * HeroSection — Landing page hero with gradient background,
 * headline, CTA buttons, and stats bar.
 */

import Link from "next/link";
import { Sparkles, ArrowRight, Users, Star, Shield } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/motion";

const STATS = [
  { icon: Users, value: "12,000+", label: "Assessments Taken" },
  { icon: Star, value: "98%", label: "Satisfaction Rate" },
  { icon: Shield, value: "5", label: "Validated Tools" },
] as const;

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
          <Sparkles size={14} aria-hidden="true" />
          Evidence-Based Psychological Assessments
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
          <span style={{ color: "var(--brand-primary-dark, #6B5CA0)" }}>Mind and Body</span>
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
          Take validated psychological assessments designed to help you gain deeper insight into
          your personality, stress levels, and mental health — in just a few minutes.
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
            Explore Assessments <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium no-underline transition-colors"
            style={{
              background: "#FFFFFF",
              color: "var(--brand-primary-dark, #6B5CA0)",
              border: "1.5px solid rgba(155, 142, 196, 0.31)",
            }}
          >
            Learn More
          </Link>
        </div>

        {/* Stats bar */}
        <motion.div
          className="mt-14 flex flex-wrap items-center justify-center gap-10"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <div
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(155, 142, 196, 0.08)" }}
                >
                  <Icon size={22} color="var(--brand-primary, #9B8EC4)" aria-hidden="true" />
                </div>
                <div
                  className="font-heading text-[26px] font-bold"
                  style={{ color: "var(--brand-primary-dark, #6B5CA0)" }}
                >
                  {s.value}
                </div>
                <div className="text-[13px]" style={{ color: "var(--text-muted, #718096)" }}>
                  {s.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
