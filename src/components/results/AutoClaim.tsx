"use client";

/**
 * AutoClaim — Silent claim executor for authenticated users.
 *
 * When an authenticated user lands on the results page (e.g., after
 * returning from login/signup via callbackUrl), this component checks
 * localStorage for a pending claimToken and fires the claimSession
 * mutation automatically.
 *
 * Renders nothing visible — pure side-effect component.
 * Mounted only when `isAuthenticated === true` on the results page.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface AutoClaimProps {
  sessionId: string;
  accentColor: string;
}

/* ═══════════════════════════════════════════════════════
   localStorage helpers
   ═══════════════════════════════════════════════════════ */

interface ClaimData {
  sessionId: string;
  claimToken: string;
}

function getClaimData(sessionId: string): ClaimData | null {
  try {
    const raw = localStorage.getItem(`chp_claim_${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClaimData;
    if (parsed.sessionId && parsed.claimToken) return parsed;
    return null;
  } catch {
    return null;
  }
}

function clearClaimData(sessionId: string): void {
  try {
    localStorage.removeItem(`chp_claim_${sessionId}`);
  } catch {
    /* noop */
  }
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function AutoClaim({ sessionId, accentColor }: AutoClaimProps) {
  const router = useRouter();
  const hasFired = useRef(false);
  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "none">("idle");

  const claimMutation = trpc.sessions.claimSession.useMutation({
    onSuccess: () => {
      setStatus("success");
      clearClaimData(sessionId);
      // Soft refresh to update auth-dependent UI
      setTimeout(() => router.refresh(), 1500);
    },
    onError: () => {
      // Token expired or already claimed — clear and move on silently
      clearClaimData(sessionId);
      setStatus("none");
    },
  });

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const data = getClaimData(sessionId);
    if (!data) {
      setStatus("none");
      return;
    }

    setStatus("claiming");
    claimMutation.mutate({
      sessionId: data.sessionId,
      claimToken: data.claimToken,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire-once on mount
  }, [sessionId]);

  if (status === "none" || status === "idle") return null;

  return (
    <div
      className="mb-6 flex items-center gap-2 rounded-2xl border px-5 py-3 text-[13px] font-medium"
      style={{
        background: `color-mix(in oklch, ${accentColor} 3%, var(--card))`,
        borderColor: `color-mix(in oklch, ${accentColor} 12%, transparent)`,
        color: accentColor,
      }}
    >
      {status === "claiming" && (
        <>
          <Loader2 size={14} className="animate-spin" />
          Menyimpan hasil ke akun Anda…
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 size={14} />
          Hasil berhasil disimpan ke dashboard Anda!
        </>
      )}
    </div>
  );
}
