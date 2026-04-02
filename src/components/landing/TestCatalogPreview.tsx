"use client";

/**
 * TestCardGrid — 3-column grid of available assessments for the homepage.
 * Uses Framer Motion stagger animation for card entrance.
 */

import Link from "next/link";
import { motion } from "motion/react";
import { TESTS, ICON_MAP } from "@/lib/data/tests";
import { staggerContainer, fadeUp } from "@/lib/motion";

export function TestCardGrid() {
  return (
    <section className="mx-auto max-w-[1000px] px-6 py-20">
      {/* Section heading */}
      <div className="mb-12 text-center">
        <h2
          className="font-heading font-bold"
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            color: "var(--text-heading, #1A202C)",
            marginBottom: 12,
          }}
        >
          Available Assessments
        </h2>
        <p
          className="mx-auto max-w-[480px] text-[15px]"
          style={{ color: "var(--text-muted, #718096)" }}
        >
          Each tool is carefully selected based on scientific validity and clinical utility.
        </p>
      </div>

      {/* Card grid */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-60px" }}
      >
        {TESTS.slice(0, 3).map((test) => {
          const Icon = ICON_MAP[test.iconName];
          return (
            <motion.div
              key={test.id}
              variants={fadeUp}
              className="flex flex-col rounded-2xl bg-white p-6 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: `1.5px solid ${test.color}25`,
                boxShadow: `0 4px 24px ${test.color}14`,
              }}
            >
              {/* Icon */}
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: `${test.color}15` }}
              >
                {Icon && <Icon size={24} color={test.color} aria-hidden="true" />}
              </div>

              {/* Meta pill */}
              <span
                className="mb-3 inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  background: `${test.color}18`,
                  color: test.color,
                }}
              >
                {test.itemCount} items · {test.duration}
              </span>

              {/* Title */}
              <h3
                className="mb-2 font-heading text-[17px] font-bold"
                style={{ color: "var(--text-heading, #1A202C)" }}
              >
                {test.shortName}
              </h3>

              {/* Description */}
              <p
                className="mb-5 flex-1 text-[14px] leading-[1.65]"
                style={{ color: "var(--text-muted, #718096)" }}
              >
                {test.description}
              </p>

              {/* CTA */}
              <Link
                href={`/test/${test.id}/briefing`}
                className="block rounded-xl py-3 text-center text-[14px] font-semibold text-white no-underline transition-shadow hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${test.color}, ${test.color}CC)`,
                  boxShadow: `0 4px 14px ${test.color}45`,
                }}
              >
                Start Test →
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
