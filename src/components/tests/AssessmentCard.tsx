"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TestMeta } from "@/lib/data/tests";

/* ═══════════════════════════════════════════════════════
   Assessment Card — Figma-matched design with thumbnail hero
   ═══════════════════════════════════════════════════════ */

interface AssessmentCardProps {
  test: TestMeta;
  /** Zero-based index for staggered entrance animation */
  index: number;
}

export function AssessmentCard({ test, index }: AssessmentCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  /** 3D perspective tilt — follows cursor position over the card */
  function handleMouseMove(e: MouseEvent<HTMLAnchorElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
  }

  const hasThumb = !!test.thumbnailUrl;

  return (
    <Link
      href={`/test/${test.slug}/briefing`}
      ref={cardRef}
      className="group block h-full will-change-transform rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s",
        animationDelay: `${index * 70}ms`,
      }}
    >
      <Card className="relative flex h-full flex-col overflow-hidden border-border/50 bg-card shadow-sm transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-primary/8">
        {/* ── Hero Image / Thumbnail Section ── */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {hasThumb ? (
            <Image
              src={test.thumbnailUrl!}
              alt={test.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            /* Fallback: gradient with abbreviation */
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${test.color}20, ${test.color}08)`,
              }}
            >
              <span
                className="font-heading text-4xl font-black tracking-tight"
                style={{ color: `${test.color}60` }}
              >
                {test.abbreviation}
              </span>
            </div>
          )}

          {/* Category badge — overlay top-left */}
          <div className="absolute left-3 top-3">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
              style={{
                background: `${test.color}CC`,
                color: "white",
                boxShadow: `0 2px 8px ${test.color}40`,
              }}
            >
              {test.category}
            </span>
          </div>

          {/* Abbreviation + Author overlay — bottom-left on image */}
          <div
            className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-10"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
            }}
          >
            <h3 className="font-heading text-2xl font-black leading-tight tracking-tight text-white drop-shadow-md">
              {test.abbreviation}
            </h3>
            <p className="mt-0.5 text-[12px] font-medium text-white/80 drop-shadow-sm">
              {test.author ?? "—"}
              {test.releaseYear ? ` (${test.releaseYear})` : ""}
            </p>
          </div>
        </div>

        {/* ── Content Section ── */}
        <div className="flex flex-1 flex-col p-5">
          {/* Full title */}
          <h4 className="mb-2 font-heading text-[15px] font-bold leading-snug text-foreground">
            {test.title}
          </h4>

          {/* Description — clamped to 3 lines */}
          <p className="mb-4 flex-1 text-[13px] leading-relaxed text-muted-foreground line-clamp-3">
            {test.description}
          </p>

          {/* Bottom row: item count + CTA button */}
          <div className="flex items-end justify-between">
            {/* Item count box */}
            <div
              className="rounded-xl border px-4 py-2 text-center"
              style={{
                borderColor: `${test.color}20`,
                background: `${test.color}06`,
              }}
            >
              <span className="block text-lg font-bold text-foreground">{test.questionCount}</span>
              <span className="text-[11px] text-muted-foreground">Items</span>
            </div>

            {/* Start button */}
            <div
              className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${test.color}, ${test.color}CC)`,
                boxShadow: `0 4px 12px ${test.color}35`,
              }}
            >
              Start <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
