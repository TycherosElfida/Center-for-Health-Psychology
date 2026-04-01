"use client";

/**
 * ReportRequestForm — Email lead capture with react-hook-form + zod validation.
 *
 * Kaizen change: NO direct PDF downloads for anonymous users. Instead,
 * the user submits their email and gets the report delivered asynchronously.
 *
 * Form stack:
 *   - react-hook-form (controlled form state)
 *   - @hookform/resolvers/zod (schema validation)
 *   - trpc.sessions.requestEmailReport (server mutation)
 *
 * Typography: Outfit for headings (font-heading), Inter for body.
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Send, CheckCircle2, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

/* ═══════════════════════════════════════════════════════
   Schema
   ═══════════════════════════════════════════════════════ */

const reportRequestSchema = z.object({
  email: z.string().min(1, "Masukkan alamat email Anda.").email("Format email tidak valid."),
});

type ReportRequestValues = z.infer<typeof reportRequestSchema>;

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface ReportRequestFormProps {
  /** UUID of the result record. */
  scoreId: string;
  /** Test short name for display. */
  testShortName: string;
  /** Brand colour for styling. */
  accentColor: string;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ReportRequestForm({ scoreId, testShortName, accentColor }: ReportRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportRequestValues>({
    resolver: zodResolver(reportRequestSchema),
    defaultValues: { email: "" },
  });

  const requestMutation = trpc.sessions.requestEmailReport.useMutation({
    onSuccess: (_data, variables) => {
      setIsSent(true);
      setSentEmail(variables.email);
    },
  });

  const toggle = useCallback(() => {
    setIsOpen((p) => !p);
    reset();
    setIsSent(false);
    setSentEmail("");
  }, [reset]);

  const onSubmit = useCallback(
    (values: ReportRequestValues) => {
      requestMutation.mutate({ scoreId, email: values.email });
    },
    [requestMutation, scoreId]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle CTA */}
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
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                  <div className="flex-1">
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="anda@email.com"
                      {...register("email")}
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50"
                      style={{
                        borderColor: errors.email ? "var(--destructive, #e53e3e)" : "var(--border)",
                      }}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={requestMutation.isPending}
                    className="flex shrink-0 items-center gap-2 self-start rounded-xl px-5 py-3 font-heading text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, color-mix(in oklch, ${accentColor} 80%, white))`,
                      boxShadow: `0 4px 16px color-mix(in oklch, ${accentColor} 30%, transparent)`,
                    }}
                  >
                    {requestMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Kirim
                  </button>
                </div>

                {/* Server error */}
                {requestMutation.error && (
                  <p className="mt-2 text-xs text-destructive">
                    Terjadi kesalahan. Silakan coba lagi.
                  </p>
                )}
              </form>
            ) : (
              /* ── Success state ── */
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
                    <strong style={{ color: accentColor }}>{sentEmail}</strong>.
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
