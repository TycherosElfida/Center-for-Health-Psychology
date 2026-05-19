import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shield, CheckCircle2, Eye, AlertTriangle, Heart, Hand, Info } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { eq, and, countDistinct } from "drizzle-orm";
import { db } from "@/server/db";
import { tests, questions } from "@/server/schema/tests";
import { BriefingActions } from "@/components/test/BriefingActions";

/* ═══════════════════════════════════════════════════════
   Metadata
   ═══════════════════════════════════════════════════════ */

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Fetch a published test by slug with question count */
async function getTestBySlug(slug: string) {
  const rows = await db
    .select({
      slug: tests.slug,
      title: tests.title,
      description: tests.description,
      abbreviation: tests.abbreviation,
      category: tests.category,
      author: tests.author,
      releaseYear: tests.releaseYear,
      thumbnailUrl: tests.thumbnailUrl,
      color: tests.color,
      instructions: tests.instructions,
      questionCount: countDistinct(questions.id),
    })
    .from(tests)
    .leftJoin(questions, eq(questions.testId, tests.id))
    .where(and(eq(tests.slug, slug), eq(tests.status, "published"), eq(tests.isActive, true)))
    .groupBy(tests.id);

  const row = rows[0];
  if (!row) return null;
  return { ...row, color: row.color ?? "#9B8EC4", questionCount: Number(row.questionCount) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getTestBySlug(slug);
  if (!meta) return { title: "Assessment Not Found" };
  return {
    title: `${meta.abbreviation} — Sebelum Memulai | CHP`,
    description: `Baca pengantar asesmen ${meta.title} sebelum Anda memulai.`,
  };
}

/* ═══════════════════════════════════════════════════════
   Briefing bullets — per-test timeframe overrides
   ═══════════════════════════════════════════════════════ */

interface Bullet {
  icon: ElementType;
  text: ReactNode;
}

const TIMEFRAME_OVERRIDES: Record<string, ReactNode> = {
  pss10: (
    <>
      Jawablah dengan jujur berdasarkan perasaan Anda selama <strong>satu bulan terakhir</strong>.
    </>
  ),
  srq29: (
    <>
      Jawablah dengan jujur berdasarkan perasaan Anda <strong>belakangan ini</strong>.
    </>
  ),
  mbti: (
    <>
      Jawablah dengan jujur berdasarkan <strong>preferensi umum</strong> dan perilaku khas Anda.
    </>
  ),
  gpius2: (
    <>
      Jawablah dengan jujur berdasarkan <strong>kebiasaan penggunaan internet</strong> Anda
      belakangan ini.
    </>
  ),
  srs: (
    <>
      Jawablah dengan jujur berdasarkan cara Anda <strong>umumnya menghadapi</strong> tantangan dan
      hambatan.
    </>
  ),
};

function getBriefingBullets(testSlug: string, itemCount: number): Bullet[] {
  const timeframeText = TIMEFRAME_OVERRIDES[testSlug] ?? (
    <>
      Jawablah dengan jujur berdasarkan perasaan Anda selama <strong>dua minggu terakhir</strong>.
    </>
  );

  return [
    {
      icon: CheckCircle2,
      text: (
        <>
          Asesmen ini berisi <strong>{itemCount} butir</strong> pertanyaan.
        </>
      ),
    },
    {
      icon: Eye,
      text: (
        <>
          Jawaban Anda bersifat <strong>anonim</strong> dan hanya digunakan untuk keperluan
          skrining/penelitian.
        </>
      ),
    },
    {
      icon: AlertTriangle,
      text: (
        <>
          Ini <strong>bukan diagnosis klinis</strong>. Hasil hanya untuk tujuan informasi.
        </>
      ),
    },
    { icon: Heart, text: timeframeText },
    {
      icon: Hand,
      text: <>Anda dapat berhenti kapan saja. Tidak ada jawaban benar atau salah.</>,
    },
  ];
}

/* ═══════════════════════════════════════════════════════
   Derive a darker shade from a hex color for gradients
   ═══════════════════════════════════════════════════════ */

function darkenHex(hex: string, amount = 0.25): string {
  const h = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(h.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════════
   Page Component (Server)
   ═══════════════════════════════════════════════════════ */

export default async function BriefingPage({ params }: PageProps) {
  const { slug } = await params;
  const meta = await getTestBySlug(slug);
  if (!meta) notFound();

  const bullets = getBriefingBullets(meta.slug, meta.questionCount);
  const colorDark = darkenHex(meta.color);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-[640px] px-5 pb-16 pt-12">
        {/* ── Main card ── */}
        <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-lg shadow-black/[0.04]">
          {/* Header */}
          <div className="flex items-start gap-4 px-8 pb-6 pt-8">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
              style={{
                background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}10)`,
              }}
            >
              <Shield size={24} style={{ color: colorDark }} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] font-bold leading-tight text-foreground">
                {meta.abbreviation}
              </h1>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{meta.title}</p>
            </div>
          </div>

          {/* Before You Begin section */}
          <div
            className="mx-6 rounded-2xl border p-6"
            style={{
              background: `linear-gradient(135deg, oklch(0.985 0.002 200), ${meta.color}06)`,
              borderColor: `${meta.color}15`,
            }}
          >
            <div className="mb-5 flex items-center gap-2.5">
              <Info size={20} style={{ color: colorDark }} />
              <h2 className="text-[17px] font-semibold leading-tight text-foreground">
                Sebelum Memulai
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {bullets.map((b, i) => {
                const BulletIcon = b.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <BulletIcon size={18} strokeWidth={2.2} style={{ color: meta.color }} />
                    </div>
                    <p className="text-[14.5px] leading-relaxed text-muted-foreground">{b.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest warning disclaimer */}
          <div
            style={{
              margin: "16px 32px 0",
              padding: "12px 16px",
              background: "#FFF8E1",
              border: "1.5px solid #FFE082",
              borderRadius: 12,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <AlertTriangle size={16} style={{ color: "#F57F17", flexShrink: 0, marginTop: 2 }} />
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#5D4037",
                lineHeight: 1.55,
              }}
            >
              <span style={{ fontWeight: 700 }}>Penting:</span> Progres Anda tidak akan tersimpan
              jika Anda menjelajah sebagai tamu.
            </p>
          </div>

          {/* Metadata strip */}
          <div className="flex justify-center px-8 pt-6">
            {[
              { label: "Penulis", value: meta.author ?? "—" },
              { label: "Tahun", value: meta.releaseYear ? String(meta.releaseYear) : "—" },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className="flex-1 py-3.5 text-center"
                style={{
                  borderRight: i < arr.length - 1 ? "1px solid oklch(0 0 0 / 0.06)" : "none",
                }}
              >
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-[15px] font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Action buttons (client island) */}
          <BriefingActions slug={meta.slug} color={meta.color} colorDark={colorDark} />
        </div>

        {/* Privacy note below card */}
        <div
          className="mt-5 flex items-start gap-2.5 rounded-xl border p-4"
          style={{
            background: `${meta.color}08`,
            borderColor: `${meta.color}15`,
          }}
        >
          <Shield size={16} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Data Anda diproses secara lokal di peramban Anda dan tidak disimpan di server mana pun.
            Alat ini ditujukan hanya untuk keperluan edukasi dan penelitian serta tidak menggantikan
            asesmen klinis profesional.
          </p>
        </div>
      </div>
    </div>
  );
}
