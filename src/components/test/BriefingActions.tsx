"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { CONSENT_TEXT } from "@/lib/constants/consent";

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
  const [consentChecked, setConsentChecked] = useState(false);

  // Phase 2A: Query for an active session to support Forced-Resume
  const { data: activeSession, isLoading } = trpc.sessions.getActiveSession.useQuery(
    { testSlug: slug, localSessionId },
    { staleTime: 0 }
  );

  const isResuming = !!activeSession?.sessionId;

  // Resume flow bypasses consent checkbox — consent was already captured
  const canProceed = isResuming || consentChecked;

  const handleBegin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating || isLoading || !canProceed) return;
    setIsNavigating(true);

    if (isResuming && activeSession.sessionId) {
      router.push(`/test/${slug}?sessionId=${activeSession.sessionId}`);
    } else {
      router.push(`/test/${slug}/personal-info?consent=1`);
    }
  };

  return (
    <div
      className="sticky bottom-0 z-10 flex flex-col gap-3 px-6 py-6 sm:static sm:px-8 sm:pb-8"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(255,255,255,0.85)",
      }}
    >
      {/* Consent checkbox — hidden when resuming an existing session */}
      {!isResuming && (
        <label
          htmlFor="consent-checkbox"
          className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors"
          style={{
            borderColor: consentChecked ? `${color}40` : "var(--border)",
            background: consentChecked
              ? `linear-gradient(135deg, ${color}06, ${color}03)`
              : "transparent",
          }}
        >
          <input
            id="consent-checkbox"
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-current"
            style={{ accentColor: color }}
          />
          <span className="text-[13.5px] leading-relaxed text-muted-foreground">
            {CONSENT_TEXT}
          </span>
        </label>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isNavigating}
          className="w-full flex items-center justify-center gap-2 rounded-full border-[1.5px] border-border bg-white px-6 py-4 text-base font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground cursor-pointer sm:w-auto sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <button
          onClick={handleBegin}
          disabled={isNavigating || isLoading || !canProceed}
          className="w-full flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white no-underline transition-all sm:w-auto sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${colorDark}, ${color})`
              : "oklch(0.80 0.02 260)",
            boxShadow: canProceed ? `0 4px 14px ${color}40` : "none",
          }}
        >
          {isLoading || isNavigating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isResuming ? (
            "Lanjutkan Asesmen"
          ) : (
            "Saya Memahami, Mulai Asesmen"
          )}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
