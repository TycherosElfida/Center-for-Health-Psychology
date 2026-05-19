"use client";

/**
 * ProfileForm — Client component for the /dashboard/profile page.
 *
 * Matches the Figma design with:
 *   - Avatar circle with initials + upload button
 *   - Name, Age, Sex, Province, City fields (pre-filled)
 *   - "Save Profile" gradient CTA
 *   - Password change section
 *
 * Uses react-hook-form + zod for validation, same field patterns
 * as PersonalInfoForm for consistency.
 */

import { useState, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Calendar,
  Users,
  MapPin,
  Save,
  Lock,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { getProvinces, getCitiesByProvince } from "@/lib/data/indonesia-regions";
import { trpc } from "@/lib/trpc/client";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";

/** Capitalize every word — e.g. "kota baru" → "Kota Baru" */
function toTitleCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ═══════════════════════════════════════════════════════
   Schema
   ═══════════════════════════════════════════════════════ */

const profileSchema = z.object({
  displayName: z.string().min(1, "Nama wajib diisi").max(100),
  age: z.string().optional(),
  sex: z.enum(["Male", "Female"], { message: "Jenis kelamin wajib dipilih" }),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  city: z.string().min(1, "Kota wajib dipilih"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface ProfileFormProps {
  profile: {
    displayName: string | null;
    sex: string | null;
    age: number | null;
    province: string | null;
    city: string | null;
  } | null;
  userName: string | null;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function ProfileForm({ profile, userName }: ProfileFormProps) {
  const [saved, setSaved] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [customProvince, setCustomProvince] = useState("");
  const [customCity, setCustomCity] = useState("");
  const provinces = getProvinces();

  // Resolve province/city codes from saved names
  // If saved name doesn't match any known province, treat as custom
  const matchedProvinceCode = profile?.province
    ? (provinces.find((p) => p.name === profile.province)?.code ?? null)
    : null;
  const savedProvinceCode = matchedProvinceCode ?? (profile?.province ? "__other__" : "");

  const matchedCityCode =
    matchedProvinceCode && profile?.city
      ? (getCitiesByProvince(matchedProvinceCode).find((c) => c.name === profile.city)?.code ??
        null)
      : null;
  const savedCityCode = matchedCityCode ?? (profile?.city ? "__other__" : "");

  // Pre-fill custom text fields if saved values don't match known codes
  const initialCustomProvince = !matchedProvinceCode && profile?.province ? profile.province : "";
  const initialCustomCity = !matchedCityCode && profile?.city ? profile.city : "";

  // Set initial custom values
  const customProvinceInitialized = useRef(false);
  const customCityInitialized = useRef(false);

  useEffect(() => {
    if (!customProvinceInitialized.current && initialCustomProvince) {
      setCustomProvince(initialCustomProvince);
      customProvinceInitialized.current = true;
    }
  }, [initialCustomProvince]);

  useEffect(() => {
    if (!customCityInitialized.current && initialCustomCity) {
      setCustomCity(initialCustomCity);
      customCityInitialized.current = true;
    }
  }, [initialCustomCity]);

  const {
    register,
    handleSubmit,
    control,
    resetField,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: profile?.displayName ?? userName ?? "",
      age: profile?.age != null ? String(profile.age) : "",
      sex: (profile?.sex as "Male" | "Female") ?? undefined,
      province: savedProvinceCode,
      city: savedCityCode,
    },
  });

  const selectedProvince = useWatch({ control, name: "province" }) as string;
  const isCustomProvince = selectedProvince === "__other__";
  const cities = selectedProvince && !isCustomProvince ? getCitiesByProvince(selectedProvince) : [];

  // Track previous province to only reset city on actual user-initiated change
  const prevProvinceRef = useRef(savedProvinceCode);

  useEffect(() => {
    if (selectedProvince !== prevProvinceRef.current) {
      if (prevProvinceRef.current !== "") {
        resetField("city", { defaultValue: "" });

        setCustomCity("");
      }
      // If switching away from custom province, clear custom text
      if (selectedProvince !== "__other__") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCustomProvince("");
      }
      prevProvinceRef.current = selectedProvince;
    }
  }, [selectedProvince, resetField]);

  const upsertProfile = trpc.profile.upsert.useMutation();

  async function onSubmit(data: ProfileFormData) {
    setSaved(false);

    // Resolve human-readable names — use custom text if "Lainnya" was selected
    let provinceName: string;
    if (data.province === "__other__") {
      provinceName = toTitleCase(customProvince);
    } else {
      const allProvinces = getProvinces();
      provinceName = allProvinces.find((p) => p.code === data.province)?.name || data.province;
    }

    let cityName: string;
    if (data.city === "__other__") {
      cityName = toTitleCase(customCity);
    } else {
      const allCities = data.province ? getCitiesByProvince(data.province) : [];
      cityName = allCities.find((c) => c.code === data.city)?.name || data.city;
    }

    const parsedAge = data.age?.trim() ? parseInt(data.age, 10) : undefined;

    await upsertProfile.mutateAsync({
      displayName: data.displayName,
      sex: data.sex,
      age: parsedAge ?? null,
      province: provinceName,
      city: cityName,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Watched values for styling
  const nameVal = useWatch({ control, name: "displayName" }) as string;
  const ageVal = useWatch({ control, name: "age" }) as string;
  const sexVal = useWatch({ control, name: "sex" }) as string;
  const cityVal = useWatch({ control, name: "city" }) as string;
  const isCustomCity = cityVal === "__other__";

  const accentColor = "var(--brand-primary, #9B8EC4)";

  function borderStyle(filled: boolean, hasError: boolean): string {
    if (hasError) return "1.5px solid #FC8181";
    if (filled) return `1.5px solid var(--brand-primary-mid, #C5BADF)`;
    return "1.5px solid var(--border-input, #E2E8F0)";
  }

  return (
    <div className="space-y-6">
      {/* ═══ Profile Card ═══ */}
      <div
        className="overflow-hidden rounded-2xl border bg-card"
        style={{
          borderColor: "var(--border-subtle, #E2DCF0)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Accent bar */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))`,
          }}
        />

        <div className="p-7 sm:p-9">
          {/* Privacy note */}
          <div
            className="mb-7 flex items-start gap-3 rounded-2xl p-4"
            style={{
              background: "var(--brand-primary-light, #EDE9F8)",
              border: "1px solid var(--border-subtle, #E2DCF0)",
            }}
          >
            <Lock size={16} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
            <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
              Informasi Anda hanya disimpan di perangkat Anda dan akan otomatis terisi saat Anda
              memulai asesmen baru.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
            {/* ── Name ── */}
            <FieldWrapper
              icon={<User size={15} style={{ color: nameVal ? accentColor : undefined }} />}
              label="Nama atau Inisial"
              required
              error={errors.displayName?.message}
            >
              <input
                type="text"
                placeholder="cth. Alex atau A.S."
                {...register("displayName")}
                className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-colors"
                style={{
                  border: borderStyle(!!nameVal, !!errors.displayName),
                  background: nameVal ? `var(--brand-primary-light, #EDE9F8)10` : "white",
                }}
              />
            </FieldWrapper>

            {/* ── Age ── */}
            <FieldWrapper
              icon={<Calendar size={15} style={{ color: ageVal ? accentColor : undefined }} />}
              label="Usia"
              optional
              error={errors.age?.message}
            >
              <input
                type="number"
                min={5}
                max={120}
                placeholder="cth. 24"
                {...register("age")}
                className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-colors"
                style={{
                  border: borderStyle(!!ageVal, !!errors.age),
                  background: ageVal ? `var(--brand-primary-light, #EDE9F8)10` : "white",
                }}
              />
            </FieldWrapper>

            {/* ── Sex ── */}
            <FieldWrapper
              icon={<Users size={15} style={{ color: sexVal ? accentColor : undefined }} />}
              label="Jenis Kelamin"
              required
              error={errors.sex?.message}
            >
              <div className="flex gap-3">
                {(["Male", "Female"] as const).map((option) => {
                  const selected = sexVal === option;
                  const displayLabel = option === "Male" ? "Laki-laki" : "Perempuan";
                  return (
                    <label
                      key={option}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all"
                      style={{
                        border: selected
                          ? `1.5px solid var(--brand-primary, #9B8EC4)`
                          : "1.5px solid var(--border-input, #E2E8F0)",
                        background: selected ? `var(--brand-primary-light, #EDE9F8)` : "white",
                        color: selected
                          ? "var(--brand-primary-dark, #6B5CA0)"
                          : "var(--text-body, #4A5568)",
                        boxShadow: selected ? `0 2px 8px rgba(155,142,196,0.2)` : "none",
                      }}
                    >
                      <input type="radio" value={option} {...register("sex")} className="sr-only" />
                      {selected && <CheckCircle2 size={14} />}
                      {displayLabel}
                    </label>
                  );
                })}
              </div>
            </FieldWrapper>

            {/* ── Province ── */}
            <FieldWrapper
              icon={
                <MapPin size={15} style={{ color: selectedProvince ? accentColor : undefined }} />
              }
              label="Provinsi"
              required
              error={errors.province?.message}
            >
              <select
                {...register("province")}
                className="w-full cursor-pointer appearance-none rounded-xl bg-no-repeat px-4 py-3 pr-10 text-sm outline-none transition-colors"
                style={{
                  border: borderStyle(!!selectedProvince, !!errors.province),
                  backgroundColor: selectedProvince
                    ? `var(--brand-primary-light, #EDE9F8)10`
                    : "white",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundPosition: "right 14px center",
                }}
              >
                <option value="">Pilih provinsi…</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
                <option value="__other__">Lainnya (ketik manual)</option>
              </select>
              {isCustomProvince && (
                <input
                  type="text"
                  placeholder="Ketik nama provinsi…"
                  value={customProvince}
                  onChange={(e) => setCustomProvince(e.target.value)}
                  className="mt-2 w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-colors"
                  style={{
                    border: borderStyle(!!customProvince, false),
                    background: customProvince ? `var(--brand-primary-light, #EDE9F8)10` : "white",
                  }}
                />
              )}
            </FieldWrapper>

            {/* ── City / Region ── */}
            <FieldWrapper
              icon={<MapPin size={15} style={{ color: cityVal ? accentColor : undefined }} />}
              label="Kota / Kabupaten"
              required
              error={errors.city?.message}
            >
              <select
                {...register("city")}
                disabled={!selectedProvince}
                className="w-full cursor-pointer appearance-none rounded-xl bg-no-repeat px-4 py-3 pr-10 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  border: borderStyle(!!cityVal, !!errors.city),
                  backgroundColor: cityVal ? `var(--brand-primary-light, #EDE9F8)10` : "white",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundPosition: "right 14px center",
                }}
              >
                {isCustomProvince ? (
                  <>
                    <option value="">Pilih opsi…</option>
                    <option value="__other__">Lainnya (ketik manual)</option>
                  </>
                ) : (
                  <>
                    <option value="">
                      {selectedProvince
                        ? "Pilih kota / kabupaten…"
                        : "Pilih provinsi terlebih dahulu"}
                    </option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__other__">Lainnya (ketik manual)</option>
                  </>
                )}
              </select>
              {isCustomCity && (
                <input
                  type="text"
                  placeholder="Ketik nama kota / kabupaten…"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="mt-2 w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-colors"
                  style={{
                    border: borderStyle(!!customCity, false),
                    background: customCity ? `var(--brand-primary-light, #EDE9F8)10` : "white",
                  }}
                />
              )}
            </FieldWrapper>

            {/* ── Save Button ── */}
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-none py-4 text-base font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isValid
                  ? `linear-gradient(135deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))`
                  : "oklch(0.93 0.02 260)",
                color: isValid ? "white" : "oklch(0.70 0.03 260)",
                boxShadow: isValid ? `0 8px 28px rgba(155,142,196,0.35)` : "none",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan…
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={18} />
                  Profil Tersimpan!
                </>
              ) : (
                <>
                  <Save size={18} />
                  Simpan Profil
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ═══ Password Section Card ═══ */}
      <div
        className="flex items-center gap-4 rounded-2xl border bg-card p-5"
        style={{
          borderColor: "var(--border-subtle, #E2DCF0)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--brand-primary-light, #EDE9F8)" }}
        >
          <KeyRound size={18} style={{ color: "var(--brand-primary, #9B8EC4)" }} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[14px] font-bold text-foreground">Kata Sandi</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Terakhir diubah baru-baru ini &middot; pastikan tetap kuat dan unik.
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => setPasswordModalOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all hover:shadow-sm"
          style={{
            borderColor: "var(--brand-primary-mid, #C5BADF)",
            color: "var(--brand-primary-dark, #6B5CA0)",
            background: "white",
          }}
        >
          <Lock size={13} />
          Ubah Kata Sandi
        </button>
      </div>

      {/* ═══ Change Password Modal ═══ */}
      <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FieldWrapper — reusable form field chrome
   ═══════════════════════════════════════════════════════ */

function FieldWrapper({
  icon,
  label,
  required,
  optional,
  error,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          {icon}
          {label}
          {required && (
            <span style={{ color: "var(--brand-primary, #9B8EC4)", fontSize: 14, lineHeight: 1 }}>
              *
            </span>
          )}
        </label>
        {optional && <span className="text-[11px] text-muted-foreground/60">Opsional</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
