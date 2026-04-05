"use client";

/**
 * ClaimCTA — "Save Your Results" call-to-action for anonymous users.
 *
 * Reads the claimToken from localStorage (set during startSession)
 * and presents a prompt to sign up / log in. The callbackUrl ensures
 * the user returns to /results/[scoreId] after auth.
 *
 * This component is conditionally rendered: the RSC parent only mounts
 * it when the user is NOT authenticated.
 */

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface ClaimCTAProps {
  sessionId: string;
  scoreId: string;
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

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ClaimCTA({ sessionId, scoreId, accentColor }: ClaimCTAProps) {
  // Lazy initial state — read localStorage once on mount
  const [hasClaimData] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getClaimData(sessionId) !== null;
  });

  // Construct callbackUrl — after auth, user returns here to trigger claim
  const callbackUrl = encodeURIComponent(`/results/${scoreId}`);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: `color-mix(in oklch, ${accentColor} 3%, var(--card))`,
        borderColor: `color-mix(in oklch, ${accentColor} 12%, transparent)`,
      }}
    >
      <div className="flex items-start gap-3">
        <Shield size={18} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
        <div>
          <p className="mb-1.5 font-heading text-sm font-bold text-foreground">Simpan Hasil Anda</p>
          <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
            {hasClaimData
              ? "Masuk atau buat akun untuk menyimpan hasil ini ke dashboard pribadi Anda. Data asesmen Anda akan terhubung dengan akun Anda secara aman."
              : "Buat akun untuk menyimpan hasil asesmen ke dashboard pribadi Anda dan melacak perkembangan dari waktu ke waktu."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/login?callbackUrl=${callbackUrl}`}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white no-underline transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                boxShadow: `0 4px 16px ${accentColor}30`,
              }}
            >
              Masuk & Simpan
              <ArrowRight size={14} />
            </Link>
            <Link
              href={`/signup?callbackUrl=${callbackUrl}`}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[13px] font-semibold no-underline transition-colors hover:bg-secondary"
              style={{
                borderColor: `color-mix(in oklch, ${accentColor} 20%, var(--border))`,
                color: accentColor,
              }}
            >
              Daftar Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
