"use client";

/**
 * BrandPanel — Right-side brand panel for auth split-screen
 *
 * Features:
 * - Oversized Ψ letterform at 8% opacity for subliminal depth
 * - Rotating Indonesian encouragement quotes with AnimatePresence
 * - Trust-building value pills anchored at the bottom
 * - Hidden on mobile (replaced by compact header strip in AuthSplitLayout)
 *
 * Differentiation: No stock photos, no blobs, no generic illustrations.
 * The Ψ motif + rotating clinical quotes create a unique identity.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const QUOTES = [
  { text: "Kenali dirimu lebih baik.", sub: "Langkah pertama menuju kesejahteraan." },
  { text: "Tidak ada jawaban benar atau salah.", sub: "Hanya kejujuranmu yang berarti." },
  { text: "Privasi adalah prioritas kami.", sub: "Data kamu aman dan terenkripsi." },
  { text: "Lebih dari sekadar skor.", sub: "Insight yang membantu kamu berkembang." },
] as const;

const TRUST_PILLS = [
  "Privasi Terjamin",
  "Instrumen Tervalidasi Klinis",
  "Insight Mendalam",
] as const;

export function BrandPanel() {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative hidden md:flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #6B5CA0, #9B8EC4, #C5BADF)",
      }}
    >
      {/* Ψ letterform — decorative background layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
        style={{
          fontSize: "clamp(140px, 22vw, 200px)",
          fontFamily: "var(--font-outfit), Outfit, sans-serif",
          fontWeight: 700,
          color: "rgba(255,255,255,0.08)",
          lineHeight: 1,
        }}
      >
        Ψ
      </div>

      {/* Rotating quote */}
      <div className="relative z-10 text-center px-10 max-w-xs">
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIdx}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {(() => {
              const q = QUOTES[quoteIdx]!;
              return (
                <>
                  <p
                    className="text-white text-xl font-semibold leading-snug mb-2"
                    style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                  >
                    {q.text}
                  </p>
                  <p className="text-white/65 text-sm leading-relaxed">{q.sub}</p>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-6" role="tablist">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              onClick={() => setQuoteIdx(i)}
              role="tab"
              aria-selected={i === quoteIdx}
              aria-label={`Quote ${i + 1} of ${QUOTES.length}`}
              className="transition-all duration-300 rounded-full bg-white/40 hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              style={{
                width: i === quoteIdx ? 14 : 5,
                height: 5,
                opacity: i === quoteIdx ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Trust pills — anchored at bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 px-8 z-10">
        {TRUST_PILLS.map((label) => (
          <div
            key={label}
            className="text-white/80 text-xs text-center px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "0.5px solid rgba(255,255,255,0.2)",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
