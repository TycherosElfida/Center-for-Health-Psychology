"use client";

/**
 * TestCardGrid — Landing page assessment preview grid.
 * Fetches published tests from tRPC and renders simple cards
 * matching the Figma design: thumbnail, item badge, title,
 * description, full-width colored Start button.
 */

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { trpc } from "@/lib/trpc/client";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { Loader2 } from "lucide-react";

export function TestCardGrid() {
  const { data: tests = [], isLoading } = trpc.publicTests.getPublishedTests.useQuery();

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
          Asesmen Tersedia
        </h2>
        <p
          className="mx-auto max-w-[480px] text-[15px]"
          style={{ color: "var(--text-muted, #718096)" }}
        >
          Setiap instrumen dipilih secara cermat berdasarkan validitas ilmiah dan kegunaan klinis.
        </p>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : (
        /* Card grid */
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
        >
          {tests.map((test) => (
            <motion.div
              key={test.slug}
              variants={fadeUp}
              className="flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: `1.5px solid ${test.color}25`,
                boxShadow: `0 4px 24px ${test.color}14`,
              }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                {test.thumbnailUrl ? (
                  <Image
                    src={test.thumbnailUrl}
                    alt={test.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      background: `linear-gradient(145deg, ${test.color}20, ${test.color}08)`,
                    }}
                  >
                    <span
                      className="font-heading text-4xl font-black tracking-tight"
                      style={{ color: `${test.color}50` }}
                    >
                      {test.abbreviation}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                {/* Item count badge */}
                <span
                  className="mb-3 inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: `${test.color}12`,
                    color: test.color,
                  }}
                >
                  {test.questionCount} butir
                </span>

                {/* Title */}
                <h3
                  className="mb-2 font-heading text-[17px] font-bold"
                  style={{ color: "var(--text-heading, #1A202C)" }}
                >
                  {test.title}
                </h3>

                {/* Description */}
                <p
                  className="mb-5 flex-1 text-[14px] leading-[1.65] line-clamp-3"
                  style={{ color: "var(--text-muted, #718096)" }}
                >
                  {test.description}
                </p>

                {/* CTA — full-width colored button */}
                <Link
                  href={`/test/${test.slug}/briefing`}
                  className="block rounded-xl py-3 text-center text-[14px] font-semibold text-white no-underline transition-shadow hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${test.color}, ${test.color}CC)`,
                    boxShadow: `0 4px 14px ${test.color}45`,
                  }}
                >
                  Mulai Tes →
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
