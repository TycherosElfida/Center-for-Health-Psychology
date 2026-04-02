"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";
import { Clock, Users, ArrowRight, BadgeCheck, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TestMeta, TestStatus } from "@/lib/data/tests";
import { ICON_MAP, STATUS_STYLES } from "@/lib/data/tests";

/** Resolve icon from the map; falls back to Brain if key is unknown */
function TestIcon({
  name,
  size,
  color,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const IconComponent = ICON_MAP[name] ?? Brain;
  return <IconComponent size={size} color={color} className={className} />;
}

/* ═══════════════════════════════════════════════════════
   Assessment Card — Premium 3D tilt on hover
   ═══════════════════════════════════════════════════════ */

interface AssessmentCardProps {
  test: TestMeta;
  /** Zero-based index for staggered entrance animation */
  index: number;
}

export function AssessmentCard({ test, index }: AssessmentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sts = STATUS_STYLES[test.status as TestStatus];

  /** 3D perspective tilt — follows cursor position over the card */
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Clamp rotation to ±4° for subtlety
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
  }

  return (
    <div
      ref={cardRef}
      className="group will-change-transform"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s",
        animationDelay: `${index * 70}ms`,
      }}
    >
      <Card className="relative flex h-full flex-col overflow-hidden border-border/50 bg-card shadow-sm transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-primary/8">
        {/* Top colour accent — Gap #5: brand-token gradient */}
        <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)]" />

        <div className="flex flex-1 flex-col p-5">
          {/* Status + Category badges */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: sts.bg,
                color: sts.text,
                border: `1px solid ${sts.border}`,
              }}
            >
              {test.status}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: `${test.color}10`,
                color: test.color,
                border: `1px solid ${test.color}25`,
              }}
            >
              {test.primaryCategory}
            </span>
          </div>

          {/* Icon + Title */}
          <div className="mb-3 flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${test.color}14` }}
            >
              <TestIcon name={test.iconName} size={22} color={test.color} />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-bold leading-tight text-foreground">
                {test.shortName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {test.author}
                {test.year ? ` (${test.year})` : ""}
              </p>
            </div>
          </div>

          {/* Full name */}
          <p className="mb-2 text-[13px] leading-snug text-foreground/70">
            {test.name !== test.shortName ? test.name : test.description}
          </p>

          {/* Description — clamped to 3 lines */}
          <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {test.longDescription}
          </p>

          {/* Stats row — Gap #6: surface-subtle bg with · dividers */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--surface-subtle,#F5F3FA)] px-3 py-2 text-xs text-muted-foreground">
            <span>{test.itemCount} Items</span>
            <span aria-hidden="true">·</span>
            <span>{test.duration}</span>
            <span aria-hidden="true">·</span>
            <span>α {test.alpha ?? "—"}</span>
          </div>

          {/* Validation badge — Gap #7: always show with fallback */}
          <div className="mb-4 flex items-center gap-1.5 text-xs text-[var(--brand-primary)]">
            <BadgeCheck size={13} />
            <span>{test.validationNote ?? "Instrumen tervalidasi klinis"}</span>
          </div>

          {/* Footer: meta + CTA */}
          <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                <Clock size={12} />
                {test.duration}
              </span>
              <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                <Users size={12} />
                {(test.respondentCount ?? 0).toLocaleString("id-ID")}
              </span>
            </div>
            <Link
              href={`/test/${test.id}/briefing`}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${test.color}, ${test.color}CC)`,
                boxShadow: `0 3px 10px ${test.color}35`,
              }}
            >
              Mulai <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
