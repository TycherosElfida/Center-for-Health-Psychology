/**
 * AffirmationSection — Supportive messaging with crisis hotlines.
 *
 * Pure UI component. No client-side state needed — receives the severity
 * level from the parent and selects the appropriate Indonesian-language
 * affirmation copy. Crisis hotlines are ALWAYS rendered regardless of
 * severity, per clinical platform requirements.
 *
 * Typography: Outfit (headings via `font-heading`), Inter (body via default sans).
 */

import { Heart, Phone } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface AffirmationSectionProps {
  /** Score severity bucket from interpretation engine */
  severity: "low" | "moderate" | "high";
}

/* ═══════════════════════════════════════════════════════
   Copy — Indonesian-language affirmation messages
   ═══════════════════════════════════════════════════════ */

const AFFIRMATION_COPY: Record<"low" | "moderate" | "high", string> = {
  high: "Kami memahami bahwa hasilnya mungkin membuat Anda khawatir. Ingatlah bahwa ini adalah alat skrining, bukan diagnosis akhir. Mencari bantuan adalah langkah pertama yang berani — dan Anda sudah melakukannya dengan menyelesaikan assessment ini. Anda tidak sendirian.",
  moderate:
    "Terima kasih telah meluangkan waktu untuk memahami diri Anda lebih baik. Hasil Anda menunjukkan ada area yang bisa Anda kembangkan. Dengan kesadaran dan usaha, perubahan positif sangat mungkin dicapai.",
  low: "Selamat! Hasil Anda menunjukkan kondisi yang baik. Terus pertahankan kebiasaan sehat Anda dan jangan ragu untuk meninjau kembali secara berkala.",
};

/* ═══════════════════════════════════════════════════════
   Crisis Hotline Data
   ═══════════════════════════════════════════════════════ */

const HOTLINES = [
  { label: "Layanan Sejiwa (Kemenkes RI)", number: "119 ext. 8" },
  { label: "Into The Light Indonesia", number: "119 ext. 8" },
  { label: "LSM Jangan Bunuh Diri", number: "021-9696 9293" },
  { label: "Yayasan Pulih", number: "(021) 788-42580" },
] as const;

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function AffirmationSection({ severity }: AffirmationSectionProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklch, #6BA3BE 6%, var(--card)), color-mix(in oklch, #4DB6AC 4%, var(--card)))",
        border: "1px solid color-mix(in oklch, #6BA3BE 15%, transparent)",
      }}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in oklch, #6BA3BE 12%, transparent)",
            border: "1px solid color-mix(in oklch, #6BA3BE 25%, transparent)",
          }}
        >
          <Heart size={20} style={{ color: "#6BA3BE" }} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Title — Outfit */}
          <h3
            className="mb-2 text-[15px] font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading), var(--font-sans), sans-serif" }}
          >
            Pesan untuk Anda
          </h3>

          {/* Affirmation body — Inter */}
          <p className="mb-5 text-[14px] leading-relaxed text-muted-foreground">
            {AFFIRMATION_COPY[severity]}
          </p>

          {/* Crisis Hotlines — always visible */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "color-mix(in oklch, var(--card) 80%, transparent)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Phone size={14} className="text-muted-foreground" />
              <span
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: "var(--font-heading), var(--font-sans), sans-serif" }}
              >
                Hotline Krisis Indonesia
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {HOTLINES.map((h) => (
                <div
                  key={`${h.number}-${h.label}`}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-muted-foreground">{h.label}</span>
                  <a
                    href={`tel:${h.number.replace(/\s+/g, "").replace("ext.", ",")}`}
                    className="font-semibold text-foreground no-underline transition-colors hover:text-[#6BA3BE]"
                  >
                    {h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
