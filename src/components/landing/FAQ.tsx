"use client";

/**
 * FAQSection — Accordion-style FAQ for the homepage.
 * Client Component: requires useState for open/close toggle.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const FAQS = [
  {
    q: "Apakah asesmen ini tervalidasi secara klinis?",
    a: "Ya. Seluruh tes di platform kami didasarkan pada instrumen psikologi yang telah dikaji sejawat dan digunakan oleh tenaga kesehatan mental profesional di seluruh dunia.",
  },
  {
    q: "Berapa lama waktu yang dibutuhkan untuk setiap asesmen?",
    a: "Sebagian besar asesmen membutuhkan waktu 3–15 menit. PSS-10 dapat diselesaikan dalam sekitar 3–5 menit, SRQ-29 dalam 5–8 menit, dan MBTI dalam 10–15 menit.",
  },
  {
    q: "Apakah data saya dijaga kerahasiaannya?",
    a: "Tentu saja. Jawaban Anda dianonimkan dan disimpan secara aman. Kami tidak membagikan hasil individu kepada pihak ketiga dalam keadaan apa pun.",
  },
  {
    q: "Bisakah saya mengulang tes?",
    a: "Ya, Anda dapat mengikuti asesmen apa pun sebanyak yang Anda inginkan. Hasil dapat bervariasi tergantung kondisi emosional Anda saat itu, dan hal tersebut sepenuhnya normal.",
  },
  {
    q: "Apakah hasil ini dapat dijadikan sebagai diagnosis medis?",
    a: "Tidak. Asesmen ini merupakan alat skrining, bukan instrumen diagnostik. Silakan berkonsultasi dengan tenaga kesehatan mental profesional berlisensi untuk evaluasi klinis yang tepat.",
  },
] as const;

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="px-6 py-20"
      style={{
        background: "linear-gradient(180deg, var(--surface-subtle, #F5F3FA) 0%, #FFFFFF 100%)",
      }}
    >
      <div className="mx-auto max-w-[680px]">
        {/* Section heading */}
        <div className="mb-10 text-center">
          <h2
            className="font-heading font-bold"
            style={{
              fontSize: "clamp(22px, 3vw, 32px)",
              color: "var(--text-heading, #1A202C)",
              marginBottom: 8,
            }}
          >
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-muted, #718096)" }}>
            Semua yang perlu Anda ketahui sebelum memulai
          </p>
        </div>

        {/* Accordion list */}
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl transition-all duration-200"
                style={{
                  border: `1.5px solid ${isOpen ? "rgba(155, 142, 196, 0.31)" : "var(--border-subtle, #E2DCF0)"}`,
                  boxShadow: isOpen ? "0 4px 20px rgba(155, 142, 196, 0.09)" : "none",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between bg-white px-6 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className="text-[15px] font-medium"
                    style={{ color: "var(--text-heading, #1A202C)" }}
                  >
                    {faq.q}
                  </span>
                  <div
                    className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: isOpen
                        ? "rgba(155, 142, 196, 0.09)"
                        : "var(--surface-subtle, #F5F3FA)",
                    }}
                  >
                    {isOpen ? (
                      <ChevronUp
                        size={16}
                        color="var(--brand-primary, #9B8EC4)"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        size={16}
                        color="var(--text-muted, #718096)"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-6 pb-5 text-[14px] leading-[1.75]"
                        style={{
                          background: "rgba(155, 142, 196, 0.015)",
                          color: "var(--text-body, #4A5568)",
                        }}
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
