"use client";

/**
 * Contact Page — Form + contact info sidebar.
 *
 * Client Component: form state, mock submission.
 * No tRPC backend in this phase — client-side mock only.
 */

import { useState } from "react";
import { Mail, MapPin, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";

/* ═══════════════════════════════════════════════════════
   Contact Info Data
   ═══════════════════════════════════════════════════════ */

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "astinsokang@ukrida.ac.id",
    color: "#9B8EC4",
  },
  {
    icon: MapPin,
    label: "Alamat",
    value:
      "Kampus 1 Universitas Kristen Krida Wacana\nJl. Tanjung Duren Raya No.4 Tj. Duren Utara, Kec. Grogol Petamburan, Kota Jakarta Barat, Jakarta 11470",
    color: "#8BA3D4",
  },
] as const;

const OFFICE_HOURS = [
  { day: "Senin – Jumat", hours: "08:00 – 16:00 WIB" },
  { day: "Sabtu", hours: "08:00 – 12:00 WIB" },
  { day: "Minggu", hours: "Tutup" },
] as const;

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const inputClasses =
    "w-full rounded-xl border-[1.5px] bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--brand-primary,#9B8EC4)]";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* ── Hero ── */}
        <section
          className="px-6 pb-20 pt-[70px] text-center"
          style={{
            background:
              "linear-gradient(160deg, var(--brand-primary-light, #EDE9F8) 0%, #F5F3FA 100%)",
          }}
        >
          <h1
            className="font-heading font-extrabold leading-tight"
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              color: "var(--text-heading, #1A202C)",
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            Contact Us
          </h1>
          <p
            className="mx-auto max-w-[480px] text-[16px]"
            style={{ color: "var(--text-body, #4A5568)" }}
          >
            Kami siap mendampingi Anda dalam perjalanan menuju kesehatan mental yang lebih baik.
          </p>
        </section>

        {/* ── Body: Info + Form ── */}
        <section className="mx-auto max-w-[960px] px-6 py-[72px]">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {/* ── Left: Contact Info ── */}
            <div>
              <h2
                className="mb-2 font-heading text-[24px] font-bold"
                style={{ color: "var(--text-heading, #1A202C)" }}
              >
                Kami Siap Membantu Anda
              </h2>
              <p
                className="mb-8 text-[15px] leading-[1.8]"
                style={{ color: "var(--text-body, #4A5568)" }}
              >
                Baik Anda memiliki pertanyaan tentang penilaian kami, membutuhkan dukungan teknis,
                atau tertarik untuk berkolaborasi, kami ingin sekali mendengar dari Anda.
              </p>

              <div className="mb-10 flex flex-col gap-5">
                {CONTACT_INFO.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${item.color}15` }}
                      >
                        <Icon size={18} color={item.color} aria-hidden="true" />
                      </div>
                      <div>
                        <div
                          className="text-[12px] font-semibold uppercase tracking-[0.07em]"
                          style={{
                            color: "var(--text-muted, #718096)",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="mt-0.5 whitespace-pre-line text-[15px]"
                          style={{
                            color: "var(--text-heading, #1A202C)",
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Office hours card */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "var(--surface-subtle, #F5F3FA)",
                  border: "1px solid var(--brand-primary-light, #EDE9F8)",
                }}
              >
                <div
                  className="mb-3 font-heading text-[15px] font-semibold"
                  style={{ color: "var(--text-heading, #1A202C)" }}
                >
                  Jam Operasional
                </div>
                <div className="flex flex-col gap-2">
                  {OFFICE_HOURS.map((h) => (
                    <div key={h.day} className="flex items-center justify-between text-[13px]">
                      <span
                        style={{
                          color: "var(--text-body, #4A5568)",
                        }}
                      >
                        {h.day}
                      </span>
                      <span
                        className="font-medium"
                        style={{
                          color:
                            h.hours === "Tutup"
                              ? "var(--text-muted, #718096)"
                              : "var(--brand-primary-dark, #6B5CA0)",
                        }}
                      >
                        {h.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Form ── */}
            <div>
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center rounded-2xl p-10 text-center"
                    style={{
                      background: "var(--surface-subtle, #F5F3FA)",
                      border: "1px solid var(--brand-primary-light, #EDE9F8)",
                      minHeight: 380,
                    }}
                  >
                    <div
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ background: "rgba(155, 142, 196, 0.12)" }}
                    >
                      <CheckCircle2
                        size={32}
                        color="var(--brand-primary-dark, #6B5CA0)"
                        aria-hidden="true"
                      />
                    </div>
                    <h3
                      className="mb-2 font-heading text-[20px] font-bold"
                      style={{
                        color: "var(--text-heading, #1A202C)",
                      }}
                    >
                      Terima Kasih!
                    </h3>
                    <p
                      className="max-w-[300px] text-[14px] leading-[1.7]"
                      style={{ color: "var(--text-body, #4A5568)" }}
                    >
                      Pesan Anda telah terkirim. Tim kami akan menghubungi Anda dalam 1–2 hari
                      kerja.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({
                          name: "",
                          email: "",
                          subject: "",
                          message: "",
                        });
                      }}
                      className="mt-6 rounded-lg px-5 py-2 text-[13px] font-semibold transition-colors"
                      style={{
                        background: "rgba(155, 142, 196, 0.1)",
                        color: "var(--brand-primary-dark, #6B5CA0)",
                        border: "1px solid rgba(155, 142, 196, 0.2)",
                      }}
                    >
                      Kirim Pesan Lagi
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="mb-1.5 block text-[13px] font-semibold"
                        style={{
                          color: "var(--text-body, #4A5568)",
                        }}
                      >
                        Nama Lengkap
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Masukkan nama lengkap"
                        className={inputClasses}
                        style={{
                          borderColor: "#D4CCE8",
                          color: "var(--text-heading, #1A202C)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="mb-1.5 block text-[13px] font-semibold"
                        style={{
                          color: "var(--text-body, #4A5568)",
                        }}
                      >
                        Email
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="nama@email.com"
                        className={inputClasses}
                        style={{
                          borderColor: "#D4CCE8",
                          color: "var(--text-heading, #1A202C)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-subject"
                        className="mb-1.5 block text-[13px] font-semibold"
                        style={{
                          color: "var(--text-body, #4A5568)",
                        }}
                      >
                        Subjek
                      </label>
                      <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="Topik pesan Anda"
                        className={inputClasses}
                        style={{
                          borderColor: "#D4CCE8",
                          color: "var(--text-heading, #1A202C)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="mb-1.5 block text-[13px] font-semibold"
                        style={{
                          color: "var(--text-body, #4A5568)",
                        }}
                      >
                        Pesan
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tulis pesan Anda di sini..."
                        className={`${inputClasses} resize-none`}
                        style={{
                          borderColor: "#D4CCE8",
                          color: "var(--text-heading, #1A202C)",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))",
                        boxShadow: "var(--shadow-button)",
                      }}
                    >
                      <Send size={16} aria-hidden="true" />
                      Kirim Pesan
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
