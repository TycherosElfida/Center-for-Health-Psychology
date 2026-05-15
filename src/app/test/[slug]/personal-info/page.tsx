import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { tests } from "@/server/schema/tests";
import { userProfiles } from "@/server/schema/user-profiles";
import { getOptionalSession } from "@/lib/auth/dal";
import { PersonalInfoForm } from "@/components/test/PersonalInfoForm";
import { StepIndicator, type Step } from "@/components/test/StepIndicator";
import { CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [meta] = await db
    .select({ abbreviation: tests.abbreviation })
    .from(tests)
    .where(and(eq(tests.slug, slug), eq(tests.status, "published")))
    .limit(1);
  if (!meta) return { title: "Assessment Not Found" };
  return {
    title: `${meta.abbreviation} — Personal Information | CHP`,
    description: `Provide your demographic information before viewing your ${meta.abbreviation} results.`,
  };
}

const STEPS: Step[] = [
  { label: "1", text: "Pengarahan", status: "done" },
  { label: "2", text: "Info Anda", status: "active" },
  { label: "3", text: "Asesmen", status: "pending" },
];

export default async function PersonalInfoPage({ params }: PageProps) {
  const { slug } = await params;
  const [meta] = await db
    .select({
      slug: tests.slug,
      abbreviation: tests.abbreviation,
      color: tests.color,
    })
    .from(tests)
    .where(and(eq(tests.slug, slug), eq(tests.status, "published")))
    .limit(1);
  if (!meta) notFound();

  const color = meta.color ?? "#9B8EC4";

  // Check auth state and fetch saved profile for pre-filling
  const session = await getOptionalSession();
  const isAuthenticated = !!session;
  let savedProfile: {
    displayName: string | null;
    sex: string | null;
    age: number | null;
    province: string | null;
    city: string | null;
  } | null = null;

  if (session?.userId) {
    const [profile] = await db
      .select({
        displayName: userProfiles.displayName,
        sex: userProfiles.sex,
        age: userProfiles.age,
        province: userProfiles.province,
        city: userProfiles.city,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.userId))
      .limit(1);
    savedProfile = profile ?? null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Shield size={20} className="text-primary" />
          <span className="font-heading text-sm font-bold text-foreground">
            Center for Health Psychology
          </span>
        </Link>
        <StepIndicator steps={STEPS} />
      </header>

      {/* Main */}
      <main className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-[560px]">
          {/* Completion badge */}
          <div className="mb-6 flex justify-center">
            <div
              className="flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold"
              style={{
                background: `${color}15`,
                borderColor: `${color}35`,
                color: color,
              }}
            >
              <CheckCircle2 size={16} />
              {meta.abbreviation} — Informasi Pribadi
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="mb-2.5 font-heading text-[clamp(24px,4vw,34px)] font-extrabold tracking-tight text-foreground">
              Ceritakan Tentang Dirimu
            </h1>
            <p className="mx-auto max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
              {savedProfile
                ? "Info kamu sudah tersimpan. Kamu bisa langsung lanjut atau ubah data di bawah."
                : "Mohon berikan beberapa detail tentang diri Anda. Ini membantu kami memberikan interpretasi hasil Anda yang lebih bermakna."}
            </p>
          </div>

          {/* Form (client component) */}
          <PersonalInfoForm
            testSlug={meta.slug}
            testColor={color}
            testShortName={meta.abbreviation}
            savedProfile={savedProfile}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </main>
    </div>
  );
}
