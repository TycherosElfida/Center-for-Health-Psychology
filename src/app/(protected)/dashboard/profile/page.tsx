/**
 * /dashboard/profile/page.tsx — User Profile Page (RSC)
 *
 * Displays the authenticated user's profile form for editing
 * demographic data. Pre-fills from user_profiles if available.
 *
 * Design: Matches Figma with "UPDATE PROFILE" label, "Your Information"
 * heading, avatar, demographic fields, and password section.
 */

import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { db } from "@/server/db";
import { userProfiles } from "@/server/schema/user-profiles";
import { users } from "@/server/schema/users";
import { verifySession } from "@/lib/auth/dal";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "./_components/ProfileForm";

/* ═══════════════════════════════════════════════════════
   Metadata
   ═══════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Profil — Center for Health Psychology",
  description: "Perbarui informasi pribadi dan preferensi Anda.",
  robots: { index: false, follow: false },
};

/* ═══════════════════════════════════════════════════════
   Page Component (RSC)
   ═══════════════════════════════════════════════════════ */

export default async function ProfilePage() {
  const session = await verifySession();

  // Fetch user info
  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  // Fetch saved profile (if any)
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--surface-subtle, #F5F3FA)" }}>
      {/* ── Navbar ── */}
      <Navbar
        isAuthenticated
        variant="dashboard"
        userName={user?.name ?? null}
        userEmail={user?.email ?? null}
      />

      <main className="mx-auto max-w-[640px] px-5 pb-16 pt-8 sm:px-8">
        {/* ── Back link ── */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Kembali ke Dasbor
        </Link>

        {/* ── Header ── */}
        <div className="mb-6">
          <p
            className="mb-1 text-xs font-bold uppercase tracking-[0.15em]"
            style={{ color: "var(--brand-primary-dark, #6B5CA0)" }}
          >
            Perbarui Profil
          </p>
          <h1 className="mb-1.5 font-heading text-[clamp(24px,4vw,32px)] font-extrabold tracking-tight text-foreground">
            Informasi Anda
          </h1>
          <p className="text-sm text-muted-foreground">
            Disimpan sekali — dan otomatis terisi pada setiap asesmen berikutnya.
          </p>
        </div>

        {/* ── Accent divider ── */}
        <div
          className="mb-8 h-0.5 rounded-full"
          style={{
            background: `linear-gradient(90deg, var(--brand-primary, #9B8EC4), var(--brand-primary-mid, #C5BADF), transparent)`,
          }}
        />

        {/* ── Profile Form ── */}
        <ProfileForm profile={profile ?? null} userName={user?.name ?? null} />
      </main>
    </div>
  );
}
