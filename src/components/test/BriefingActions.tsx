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
      className="sticky bottom-0 z-10 flex flex-col gap-3 px-6 py-6 sm:flex-row sm:gap-4 sm:px-8 sm:static sm:pb-8"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(255,255,255,0.85)",
      }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="w-full flex items-center justify-center gap-2 rounded-full border-[1.5px] border-border bg-white px-6 py-4 text-base font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground cursor-pointer sm:w-auto sm:px-8"
      >
        <ArrowLeft size={16} />
        Go Back
      </button>

      <Link
        href={`/test/${slug}/personal-info`}
        className="w-full flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white no-underline transition-all hover:-translate-y-0.5 sm:w-auto sm:px-8"
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
