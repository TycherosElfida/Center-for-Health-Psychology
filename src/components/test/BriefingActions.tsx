"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface BriefingActionsProps {
  slug: string;
  color: string;
  colorDark: string;
}

export function BriefingActions({ slug, color, colorDark }: BriefingActionsProps) {
  const router = useRouter();
  const [localSessionId] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem(`chp_active_session_${slug}`) ?? undefined;
    } catch {
      return undefined;
    }
  });
  const [isNavigating, setIsNavigating] = useState(false);

  // Phase 2A: Query for an active session to support Forced-Resume
  const { data: activeSession, isLoading } = trpc.sessions.getActiveSession.useQuery(
    { testSlug: slug, localSessionId },
    { staleTime: 0 }
  );

  const isResuming = !!activeSession?.sessionId;

  const handleBegin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating || isLoading) return;
    setIsNavigating(true);

    if (isResuming && activeSession.sessionId) {
      router.push(`/test/${slug}?sessionId=${activeSession.sessionId}`);
    } else {
      router.push(`/test/${slug}/personal-info`);
    }
  };

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
        disabled={isNavigating}
        className="w-full flex items-center justify-center gap-2 rounded-full border-[1.5px] border-border bg-white px-6 py-4 text-base font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground cursor-pointer sm:w-auto sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft size={16} />
        Go Back
      </button>

      <button
        onClick={handleBegin}
        disabled={isNavigating || isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white no-underline transition-all hover:brightness-110 sm:w-auto sm:px-8 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${colorDark}, ${color})`,
          boxShadow: `0 4px 14px ${color}40`,
        }}
      >
        {isLoading || isNavigating ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isResuming ? (
          "Resume Assessment"
        ) : (
          "I Understand, Begin Assessment"
        )}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
