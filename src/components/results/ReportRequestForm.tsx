"use client";

/**
 * ReportRequestForm — Email lead capture for results delivery.
 *
 * This replaces the "Download PDF" button from the legacy design.
 * The form validates the email client-side and fires a tRPC mutation
 * to store the guest lead + trigger an async email job.
 *
 * CTA text: "Kirim Hasil ke Email Saya" (Send Results to My Email)
 */

import { useState, useCallback } from "react";
import { Mail, Send, CheckCircle2, X, Loader2 } from "lucide-react";

interface ReportRequestFormProps {
  /** UUID of the result record. */
  scoreId: string;
  /** Test short name for display. */
  testShortName: string;
  /** Brand colour for styling. */
  accentColor: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ReportRequestForm({ scoreId, testShortName, accentColor }: ReportRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((p) => !p);
    setEmail("");
    setError("");
    setIsSent(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Masukkan alamat email Anda.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError("Format email tidak valid.");
      return;
    }

    setError("");
    setIsSending(true);

    // Simulated mutation — in production this calls tRPC mutation
    // that inserts into guestLeads and enqueues an email job.
    console.info("[ReportRequestForm] Requesting report:", { scoreId, email: trimmed });

    // Simulate server round-trip
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
    }, 1200);
  }, [email, scoreId]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-heading text-[15px] font-semibold transition-all duration-200"
        style={{
          background: isOpen
            ? `color-mix(in oklch, ${accentColor} 18%, transparent)`
            : `color-mix(in oklch, ${accentColor} 10%, transparent)`,
          color: accentColor,
          border: `1.5px solid color-mix(in oklch, ${accentColor} ${isOpen ? "55" : "30"}%, transparent)`,
        }}
      >
        <Mail size={16} />
        Kirim Hasil ke Email Saya
      </button>

      {/* Expanded form panel */}
      {isOpen && (
        <div
          className="overflow-hidden rounded-2xl border transition-all duration-300"
          style={{
            borderColor: `color-mix(in oklch, ${accentColor} 30%, transparent)`,
            boxShadow: `0 4px 24px color-mix(in oklch, ${accentColor} 10%, transparent)`,
          }}
        >
          {/* Accent bar */}
          <div
            className="h-[3px]"
            style={{
              background: `linear-gradient(90deg, ${accentColor}, color-mix(in oklch, ${accentColor} 60%, white))`,
            }}
          />

          <div className="bg-card p-5 sm:p-6">
            {!isSent ? (
              <>
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={16} style={{ color: accentColor }} />
                    <span className="font-heading text-[15px] font-bold text-foreground">
                      Kirim Hasil ke Email
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggle}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/60 transition-colors hover:bg-secondary"
                  >
                    <X size={15} className="text-muted-foreground" />
                  </button>
                </div>

                <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
                  Masukkan alamat email Anda dan kami akan mengirimkan salinan laporan hasil{" "}
                  {testShortName} Anda.
                </p>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="anda@email.com"
                    className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50"
                    style={{
                      borderColor: error
                        ? "var(--destructive, #e53e3e)"
                        : email
                          ? `color-mix(in oklch, ${accentColor} 45%, transparent)`
                          : "var(--border)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSending}
                    className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 font-heading text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, color-mix(in oklch, ${accentColor} 80%, white))`,
                      boxShadow: `0 4px 16px color-mix(in oklch, ${accentColor} 30%, transparent)`,
                    }}
                  >
                    {isSending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Kirim
                  </button>
                </div>

                {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
              </>
            ) : (
              /* Success confirmation */
              <div className="flex items-center gap-4 py-2">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "color-mix(in oklch, #2ecc71 12%, transparent)",
                    border: "1.5px solid color-mix(in oklch, #2ecc71 40%, transparent)",
                  }}
                >
                  <CheckCircle2 size={20} style={{ color: "#2ecc71" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-[15px] font-bold text-foreground">
                    Hasil Terkirim!
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    Laporan {testShortName} Anda telah dikirim ke{" "}
                    <strong style={{ color: accentColor }}>{email}</strong>.
                  </p>
                </div>
                <button type="button" onClick={toggle} className="ml-auto p-1">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
