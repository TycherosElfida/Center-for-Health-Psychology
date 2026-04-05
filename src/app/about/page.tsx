import type { Metadata } from "next";
import { Users, Award } from "lucide-react";

import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { Footer } from "@/components/landing/Footer";
import { ChpLogo } from "@/components/ui/ChpLogo";
import { MotionSection } from "@/lib/motion";

/* ═══════════════════════════════════════════════════════
   SEO
   ═══════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "About Us — Center for Health Psychology",
  description:
    "Learn about the Center for Health Psychology (CHP) at UKRIDA and our mission to nurture healthy minds and bodies through evidence-based research.",
};

/* ═══════════════════════════════════════════════════════
   Static Data
   ═══════════════════════════════════════════════════════ */

const TEAM = [
  {
    name: "Dr. Yasinta Astin Sokang, S.Psi., M.Psi., Psikolog",
    role: "Kepala Riset",
    initials: "YAS",
    color: "#9B8EC4",
    bio: "Program Studi Sarjana Psikologi Universitas Kristen Krida Wacana",
  },
  {
    name: "dr. Djap Hadi Susanto, M.Kes.",
    role: "Asisten Riset",
    initials: "DHS",
    color: "#B3A8D4",
    bio: "Program Studi Sarjana Kedokteran Universitas Kristen Krida Wacana",
  },
  {
    name: "Ns. Mey Lona Verawaty Zendrato, M.Kep.",
    role: "Asisten Riset",
    initials: "MLVZ",
    color: "#8BA3D4",
    bio: "Program Studi Sarjana Keperawatan Universitas Kristen Krida Wacana",
  },
  {
    name: "Yosi Marin Mapaung, S.K.M., M.Sc.",
    role: "Asisten Riset",
    initials: "YMM",
    color: "#8BA3D4",
    bio: "Program Studi Sarjana Keperawatan Universitas Kristen Krida Wacana",
  },
  {
    name: "Michelle",
    role: "Asisten Riset",
    initials: "M",
    color: "#9B8EC4",
    bio: "Program Studi Sarjana Psikologi Universitas Kristen Krida Wacana",
  },
  {
    name: "Sanders Keane Dylan",
    role: "Asisten Riset",
    initials: "SKD",
    color: "#B3A8D4",
    bio: "Program Studi Sarjana Informatika Universitas Kristen Krida Wacana",
  },
  {
    name: "Veranica Febriane",
    role: "Asisten Riset",
    initials: "VF",
    color: "#8BA3D4",
    bio: "Program Studi Sarjana Informatika Universitas Kristen Krida Wacana",
  },
] as const;

const VALUES = [
  {
    icon: Award,
    title: "Visi",
    desc: "Menjadi pusat unggulan dalam pengembangan dan penerapan psikologi kesehatan yang berkontribusi pada terciptanya masyarakat yang sehat secara mental dan fisik di Indonesia.",
  },
  {
    icon: Users,
    title: "Misi",
    desc: "Menyediakan layanan psikologi kesehatan berbasis bukti ilmiah untuk meningkatkan kualitas hidup masyarakat melalui penelitian, edukasi, dan intervensi yang inovatif serta berkelanjutan.",
  },
] as const;

const STATS = [
  { value: "12K+", label: "Penilaian" },
  { value: "5", label: "Instrumen Tervalidasi" },
  { value: "98%", label: "Kepuasan Pengguna" },
  { value: "15+", label: "Tahun Pengalaman" },
] as const;

/* ═══════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════ */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavbarWrapper />

      <main>
        {/* ── Hero ── */}
        <section
          className="px-6 pb-20 pt-[70px] text-center"
          style={{
            background:
              "linear-gradient(160deg, var(--brand-primary-light, #EDE9F8) 0%, #F5F3FA 100%)",
          }}
        >
          <div className="mx-auto max-w-[640px]">
            <ChpLogo size={64} className="mx-auto mb-5" />
            <h1
              className="font-heading font-extrabold leading-tight"
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                color: "var(--text-heading, #1A202C)",
                letterSpacing: "-0.03em",
                marginBottom: 14,
              }}
            >
              About Us
            </h1>
            <p
              className="text-[16px] leading-[1.8]"
              style={{
                color: "var(--text-body, #4A5568)",
                textAlign: "justify",
              }}
            >
              <strong style={{ color: "var(--text-heading, #1A202C)" }}>
                The Center for Health Psychology (CHP)
              </strong>{" "}
              di UKRIDA berdedikasi untuk memajukan penelitian dan intervensi psikologis yang
              mendorong kesehatan dan kesejahteraan holistik. Dengan fondasi yang kuat dalam
              psikologi kesehatan, CHP mengintegrasikan temuan penelitian terbaru dengan inisiatif
              praktis untuk mengatasi tantangan kesehatan mental dan fisik di masyarakat.
              <br />
              <br />
              CHP berfokus pada promosi kesehatan, intervensi dini, dan strategi pencegahan untuk
              meningkatkan hasil kesehatan mental baik di tingkat individu maupun komunitas. Melalui
              penelitian kolaboratif, keterlibatan komunitas, dan kemitraan interdisipliner, CHP
              bertujuan untuk menciptakan masyarakat yang lebih sehat dengan mengatasi interaksi
              kompleks antara kesehatan mental dan fisik.
              <br />
              <br />
              <strong>
                Mari bergabung bersama kami dalam membentuk masa depan yang lebih sehat!
              </strong>
            </p>
          </div>
        </section>

        {/* ── Mission / Stats ── */}
        <MotionSection>
          <section className="mx-auto max-w-[900px] px-6 py-[72px]">
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
              <div>
                <span
                  className="mb-3 block text-[12px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: "var(--brand-primary, #9B8EC4)" }}
                >
                  Our Commitment
                </span>
                <h2
                  className="mb-4 font-heading font-bold leading-[1.3]"
                  style={{
                    fontSize: "clamp(22px, 3vw, 32px)",
                    color: "var(--text-heading, #1A202C)",
                  }}
                >
                  Stronger Minds, Healthier Lives.
                </h2>
                <p
                  className="text-[15px] leading-[1.8]"
                  style={{ color: "var(--text-body, #4A5568)" }}
                >
                  Dipandu oleh tagline &quot;Nurturing Healthy Minds &amp; Bodies,&quot; CHP
                  berkomitmen untuk memupuk ketahanan, mempromosikan literasi kesehatan mental, dan
                  mengembangkan program berbasis bukti yang mendukung kesejahteraan secara
                  keseluruhan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl p-5 text-center"
                    style={{
                      background: "var(--surface-subtle, #F5F3FA)",
                      border: "1px solid var(--brand-primary-light, #EDE9F8)",
                    }}
                  >
                    <div
                      className="font-heading text-[28px] font-extrabold"
                      style={{
                        color: "var(--brand-primary-dark, #6B5CA0)",
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="mt-1 text-[12px]"
                      style={{ color: "var(--text-muted, #718096)" }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </MotionSection>

        {/* ── Values ── */}
        <MotionSection delay={0.1}>
          <section
            className="px-6 py-[72px]"
            style={{ background: "var(--surface-subtle, #F5F3FA)" }}
          >
            <div className="mx-auto max-w-[900px]">
              <div className="mb-10 text-center">
                <h2
                  className="font-heading font-bold"
                  style={{
                    fontSize: "clamp(22px, 3vw, 32px)",
                    color: "var(--text-heading, #1A202C)",
                  }}
                >
                  Our Purpose
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {VALUES.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div
                      key={v.title}
                      className="flex gap-4 rounded-2xl bg-white p-5"
                      style={{
                        border: "1px solid var(--brand-primary-light, #EDE9F8)",
                      }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "rgba(155, 142, 196, 0.08)" }}
                      >
                        <Icon size={20} color="var(--brand-primary, #9B8EC4)" aria-hidden="true" />
                      </div>
                      <div>
                        <div
                          className="mb-1.5 font-heading text-[15px] font-semibold"
                          style={{
                            color: "var(--text-heading, #1A202C)",
                          }}
                        >
                          {v.title}
                        </div>
                        <p
                          className="text-[13px] leading-[1.7]"
                          style={{ color: "var(--text-body, #4A5568)" }}
                        >
                          {v.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </MotionSection>

        {/* ── Team ── */}
        <MotionSection delay={0.15}>
          <section className="mx-auto max-w-[900px] px-6 py-[72px]">
            <div className="mb-10 text-center">
              <h2
                className="font-heading font-bold"
                style={{
                  fontSize: "clamp(22px, 3vw, 32px)",
                  color: "var(--text-heading, #1A202C)",
                }}
              >
                Meet the Team
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="rounded-2xl bg-white p-6 text-center"
                  style={{
                    border: `1.5px solid ${member.color}25`,
                    boxShadow: `0 4px 20px ${member.color}12`,
                  }}
                >
                  {/* Avatar initials */}
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${member.color}30, ${member.color}15)`,
                      border: `2px solid ${member.color}30`,
                    }}
                  >
                    <span
                      className="font-heading text-[20px] font-extrabold"
                      style={{ color: member.color }}
                    >
                      {member.initials}
                    </span>
                  </div>
                  <div
                    className="mb-1 font-heading text-[16px] font-bold"
                    style={{ color: "var(--text-heading, #1A202C)" }}
                  >
                    {member.name}
                  </div>
                  <div className="mb-2.5 text-[12px] font-semibold" style={{ color: member.color }}>
                    {member.role}
                  </div>
                  <p
                    className="text-[13px] leading-[1.7]"
                    style={{ color: "var(--text-body, #4A5568)" }}
                  >
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </MotionSection>
      </main>

      <Footer />
    </div>
  );
}
