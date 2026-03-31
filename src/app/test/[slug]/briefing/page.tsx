import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Heart,
  Hand,
  Info,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { getTestMeta, ICON_MAP } from "@/lib/data/tests";
import { BriefingActions } from "@/components/test/BriefingActions";

/* ═══════════════════════════════════════════════════════
   Metadata
   ═══════════════════════════════════════════════════════ */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = getTestMeta(slug);
  if (!meta) return { title: "Assessment Not Found" };
  return {
    title: `${meta.shortName} — Before You Begin | CHP`,
    description: `Read the briefing for the ${meta.name} assessment before you start.`,
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
      Answer honestly based on how you&apos;ve been feeling over the{" "}
      <strong>past month</strong>.
    </>
  ),
  srq29: (
    <>
      Answer honestly based on how you&apos;ve been feeling{" "}
      <strong>recently</strong>.
    </>
  ),
  mbti: (
    <>
      Answer honestly based on your <strong>general preferences</strong> and
      typical behavior.
    </>
  ),
  gpius2: (
    <>
      Answer honestly based on your <strong>internet usage habits</strong> in
      recent times.
    </>
  ),
  srs: (
    <>
      Answer honestly based on how you <strong>generally cope</strong> with
      challenges and setbacks.
    </>
  ),
};

function getBriefingBullets(
  testId: string,
  itemCount: number,
  duration: string,
): Bullet[] {
  const timeframeText = TIMEFRAME_OVERRIDES[testId] ?? (
    <>
      Answer honestly based on how you&apos;ve been feeling over the{" "}
      <strong>past 2 weeks</strong>.
    </>
  );

  return [
    {
      icon: CheckCircle2,
      text: (
        <>
          This assessment contains <strong>{itemCount} items</strong> and takes
          approximately <strong>{duration}</strong>.
        </>
      ),
    },
    {
      icon: Eye,
      text: (
        <>
          Your responses are <strong>anonymous</strong> and will be used only for
          screening/research purposes.
        </>
      ),
    },
    {
      icon: AlertTriangle,
      text: (
        <>
          This is <strong>not a clinical diagnosis</strong>. Results are for
          informational purposes only.
        </>
      ),
    },
    { icon: Heart, text: timeframeText },
    {
      icon: Hand,
      text: <>You may stop at any time. There are no right or wrong answers.</>,
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
  const meta = getTestMeta(slug);
  if (!meta) notFound();

  const bullets = getBriefingBullets(meta.id, meta.itemCount, meta.duration);
  const TestIcon = ICON_MAP[meta.iconName] ?? Shield;
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
              <TestIcon size={24} style={{ color: colorDark }} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] font-bold leading-tight text-foreground">
                {meta.shortName}
              </h1>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {meta.name !== meta.shortName ? meta.name : meta.description}
              </p>
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
                Before You Begin
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {bullets.map((b, i) => {
                const BulletIcon = b.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <BulletIcon
                        size={18}
                        strokeWidth={2.2}
                        style={{ color: meta.color }}
                      />
                    </div>
                    <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                      {b.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata strip */}
          <div className="flex justify-center px-8 pt-6">
            {[
              {
                label: "Reliability",
                value: meta.alpha ? `α = ${meta.alpha}` : "N/A",
              },
              { label: "Author", value: meta.author ?? "—" },
              { label: "Year", value: meta.year ? String(meta.year) : "—" },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className="flex-1 py-3.5 text-center"
                style={{
                  borderRight:
                    i < arr.length - 1
                      ? "1px solid oklch(0 0 0 / 0.06)"
                      : "none",
                }}
              >
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-[15px] font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Action buttons (client island) */}
          <BriefingActions
            slug={meta.id}
            color={meta.color}
            colorDark={colorDark}
          />
        </div>

        {/* Privacy note below card */}
        <div
          className="mt-5 flex items-start gap-2.5 rounded-xl border p-4"
          style={{
            background: `${meta.color}08`,
            borderColor: `${meta.color}15`,
          }}
        >
          <Shield
            size={16}
            className="mt-0.5 shrink-0"
            style={{ color: meta.color }}
          />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Your data is processed locally in your browser and is not stored on
            any server. This tool is intended for educational and research
            purposes only and does not replace professional clinical assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
