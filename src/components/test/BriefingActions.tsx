"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface BriefingActionsProps {
  slug: string;
  color: string;
  colorDark: string;
}

export function BriefingActions({ slug, color, colorDark }: BriefingActionsProps) {
  const router = useRouter();

  return (
    <div
      className="sticky bottom-0 z-10 flex gap-3 px-6 py-6 sm:px-8 sm:static sm:pb-8"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(255,255,255,0.85)",
      }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-border bg-white py-3.5 text-[15px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Go Back
      </button>

      <Link
        href={`/test/${slug}/personal-info`}
        className="flex flex-[1.6] items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-semibold text-white no-underline transition-all hover:-translate-y-0.5"
        style={{
          background: `linear-gradient(135deg, ${colorDark}, ${color})`,
          boxShadow: `0 4px 14px ${color}40`,
        }}
      >
        I Understand, Begin Assessment
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
