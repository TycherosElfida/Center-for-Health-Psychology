import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTestMeta } from "@/lib/data/tests";
import { PersonalInfoForm } from "@/components/test/PersonalInfoForm";
import { StepIndicator, type Step } from "@/components/test/StepIndicator";
import { CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = getTestMeta(slug);
  if (!meta) return { title: "Assessment Not Found" };
  return {
    title: `${meta.shortName} — Personal Information | CHP`,
    description: `Provide your demographic information before viewing your ${meta.shortName} results.`,
  };
}

const STEPS: Step[] = [
  { label: "1", text: "Briefing", status: "done" },
  { label: "2", text: "Your Info", status: "active" },
  { label: "3", text: "Assessment", status: "pending" },
];

export default async function PersonalInfoPage({ params }: PageProps) {
  const { slug } = await params;
  const meta = getTestMeta(slug);
  if (!meta) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 no-underline"
        >
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
                background: `${meta.color}15`,
                borderColor: `${meta.color}35`,
                color: meta.color,
              }}
            >
              <CheckCircle2 size={16} />
              {meta.shortName} — Personal Information
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="mb-2.5 font-heading text-[clamp(24px,4vw,34px)] font-extrabold tracking-tight text-foreground">
              Almost there!
            </h1>
            <p className="mx-auto max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
              Please share a few details about yourself. This helps us provide a
              more meaningful interpretation of your results.
            </p>
          </div>

          {/* Form (client component) */}
          <PersonalInfoForm
            testSlug={meta.id}
            testColor={meta.color}
            testShortName={meta.shortName}
          />
        </div>
      </main>
    </div>
  );
}
