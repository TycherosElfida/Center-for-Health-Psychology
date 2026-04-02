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
    q: "Are these assessments clinically validated?",
    a: "Yes. All tests on our platform are based on established, peer-reviewed psychological instruments used by mental health professionals worldwide.",
  },
  {
    q: "How long does each assessment take?",
    a: "Most assessments take 3–15 minutes. The PSS-10 can be completed in about 3–5 minutes, the SRQ-29 in 5–8 minutes, and the MBTI in 10–15 minutes.",
  },
  {
    q: "Is my data kept private and confidential?",
    a: "Absolutely. Your responses are anonymized and stored securely. We do not share individual results with third parties under any circumstances.",
  },
  {
    q: "Can I retake a test?",
    a: "Yes, you can take any assessment as many times as you like. Results may vary depending on your current emotional state, which is completely normal.",
  },
  {
    q: "Should I use these results as a medical diagnosis?",
    a: "No. These assessments are screening tools, not diagnostic instruments. Please consult a licensed mental health professional for a proper clinical evaluation.",
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
            Frequently Asked Questions
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-muted, #718096)" }}>
            Everything you need to know before getting started
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
