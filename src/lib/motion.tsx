"use client";

/**
 * Centralized Framer Motion variants and components.
 *
 * All page-level scroll-reveal animations use <MotionSection>.
 * All stagger grids use staggerContainer + fadeUp children.
 * This file is the single source of truth for motion language.
 */

import { type ReactNode } from "react";
import { motion, type Variants } from "motion/react";

/* ═══════════════════════════════════════════════════════
   Shared easing curve — matches Figma reference
   ═══════════════════════════════════════════════════════ */

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ═══════════════════════════════════════════════════════
   Variant Definitions
   ═══════════════════════════════════════════════════════ */

/** Fade in while sliding up 24px */
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

/** Simple opacity crossfade */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
};

/** Slide in from the left edge */
export const slideInFromLeft: Variants = {
  initial: { opacity: 0, x: -32 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease } },
};

/** Parent container that staggers children's entrance */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

/** Scale in from 95% — used for card reveals */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease },
  },
};

/* ═══════════════════════════════════════════════════════
   <MotionSection /> — Standard scroll-reveal wrapper
   ═══════════════════════════════════════════════════════

   Usage:
     <MotionSection className="py-20">
       <h2>…</h2>        ← server-rendered children
     </MotionSection>

   Children remain server-renderable; only the outer
   <motion.section> carries the "use client" boundary.
   ═══════════════════════════════════════════════════════ */

interface MotionSectionProps {
  children: ReactNode;
  className?: string;
  /** Extra delay offset (seconds) for sequencing sections */
  delay?: number;
  /** HTML id for anchor linking */
  id?: string;
}

export function MotionSection({ children, className, delay = 0, id }: MotionSectionProps) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease, delay }}
    >
      {children}
    </motion.section>
  );
}
