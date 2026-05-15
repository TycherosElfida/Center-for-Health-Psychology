"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Calendar, Users, MapPin, ArrowRight, Shield } from "lucide-react";
import {
  personalInfoSchema,
  type PersonalInfoInput,
  type PersonalInfoFormData,
} from "@/lib/schemas/personal-info";
import { getProvinces, getCitiesByProvince } from "@/lib/data/indonesia-regions";
import { trpc } from "@/lib/trpc/client";

/* ═══════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════ */

interface PersonalInfoFormProps {
  testSlug: string;
  testColor: string;
  testShortName: string;
  /** Pre-filled data from user_profiles (authenticated users only) */
  savedProfile?: {
    displayName: string | null;
    sex: string | null;
    age: number | null;
    province: string | null;
    city: string | null;
  } | null;
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean;
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function PersonalInfoForm({
  testSlug,
  testColor,
  savedProfile,
  isAuthenticated,
}: PersonalInfoFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasConsent = searchParams.get("consent") === "1";
  const provinces = getProvinces();

  // Resolve province code from saved name (profile stores human-readable names)
  const savedProvinceCode = savedProfile?.province
    ? (provinces.find((p) => p.name === savedProfile.province)?.code ?? "")
    : "";
  const savedCityCode =
    savedProvinceCode && savedProfile?.city
      ? (getCitiesByProvince(savedProvinceCode).find((c) => c.name === savedProfile.city)?.code ??
        "")
      : "";

  // Guard: redirect back to briefing if consent param is missing
  useEffect(() => {
    if (!hasConsent) {
      router.replace(`/test/${testSlug}/briefing`);
    }
  }, [hasConsent, router, testSlug]);

  const {
    register,
    handleSubmit,
    control,
    resetField,
    formState: { errors, isValid, touchedFields, isSubmitting },
  } = useForm<PersonalInfoInput, unknown, PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: "onTouched",
    defaultValues: {
      name: savedProfile?.displayName ?? "",
      age: savedProfile?.age != null ? String(savedProfile.age) : "",
      sex: (savedProfile?.sex as "Male" | "Female") ?? undefined,
      province: savedProvinceCode,
      city: savedCityCode,
    },
  });

  /* ── Cascading: reset city when province changes ── */
  const selectedProvince = useWatch({ control, name: "province" }) as string;
  const cities = selectedProvince ? getCitiesByProvince(selectedProvince) : [];

  // Track previous province to only reset city on actual user-initiated change
  const prevProvinceRef = useRef(savedProvinceCode);

  useEffect(() => {
    if (selectedProvince !== prevProvinceRef.current) {
      if (prevProvinceRef.current !== "") {
        resetField("city", { defaultValue: "" });
      }
      prevProvinceRef.current = selectedProvince;
    }
  }, [selectedProvince, resetField]);

  /* ── Submit handler ── */

  const startSession = trpc.sessions.startSession.useMutation();
  const saveDemographics = trpc.sessions.saveDemographics.useMutation();
  const upsertProfile = trpc.profile.upsert.useMutation();

  async function onSubmit(data: PersonalInfoFormData) {
    // 1. Cache locally just in case
    localStorage.setItem(`chp_personal_${testSlug}`, JSON.stringify(data));

    try {
      // 2. Start session (awaits response before continuing)
      const sessionData = await startSession.mutateAsync({ testSlug, consentAccepted: true });

      // Support anonymous forced resume
      try {
        localStorage.setItem(`chp_active_session_${testSlug}`, sessionData.sessionId);
      } catch {}

      // Phase 2B.1: Persist claim token for later anonymous→authenticated handoff
      if (sessionData.claimToken) {
        try {
          localStorage.setItem(
            `chp_claim_${sessionData.sessionId}`,
            JSON.stringify({ sessionId: sessionData.sessionId, claimToken: sessionData.claimToken })
          );
        } catch {
          // non-critical
        }
      }

      // 3. Save demographics directly via TRPC mutateAsync
      try {
        // Handle potential type mismatch where react-hook-form passes string instead of transformed number
        const rawAge = data.age as unknown;
        const parsedAge =
          typeof rawAge === "string" && rawAge.trim() !== ""
            ? parseInt(rawAge, 10)
            : typeof rawAge === "number"
              ? rawAge
              : undefined;

        // Map codes back to human-readable names for database storage
        const allProvinces = getProvinces();
        const provinceName =
          allProvinces.find((p) => p.code === data.province)?.name || data.province;

        const allCities = data.province ? getCitiesByProvince(data.province) : [];
        const cityName = allCities.find((c) => c.code === data.city)?.name || data.city;

        await saveDemographics.mutateAsync({
          sessionId: sessionData.sessionId,
          name: data.name,
          sex: data.sex as "Male" | "Female",
          age: parsedAge,
          province: provinceName,
          city: cityName,
        });
      } catch (err) {
        console.error("[PersonalInfoForm] Failed to save demographics:", err);
        if (err && typeof err === "object" && "data" in err) {
          const errorData = (err as { data?: { zodError?: unknown } }).data;
          if (errorData?.zodError) {
            console.error("Zod Validation Error:", errorData.zodError);
          }
        }
      }

      // 3b. Also save to user_profiles if authenticated
      if (isAuthenticated) {
        try {
          const allProvinces2 = getProvinces();
          const provinceName2 =
            allProvinces2.find((p) => p.code === data.province)?.name || data.province;
          const allCities2 = data.province ? getCitiesByProvince(data.province) : [];
          const cityName2 = allCities2.find((c) => c.code === data.city)?.name || data.city;

          const rawAge2 = data.age as unknown;
          const parsedAge2 =
            typeof rawAge2 === "string" && rawAge2.trim() !== ""
              ? parseInt(rawAge2 as string, 10)
              : typeof rawAge2 === "number"
                ? rawAge2
                : undefined;

          await upsertProfile.mutateAsync({
            displayName: data.name,
            sex: data.sex as "Male" | "Female",
            age: parsedAge2 ?? null,
            province: provinceName2,
            city: cityName2,
          });
        } catch (err) {
          // Non-critical — profile save is best-effort
          console.error("[PersonalInfoForm] Failed to save profile:", err);
        }
      }

      // 4. Safely navigate away AFTER mutations have hit the network
      router.push(`/test/${testSlug}?sessionId=${sessionData.sessionId}`);
    } catch (err) {
      console.error("[PersonalInfoForm] Failed to start session:", err);
      if (err && typeof err === "object" && "data" in err) {
        const errorData = (err as { data?: { zodError?: unknown } }).data;
        if (errorData?.zodError) {
          console.error("Zod Validation Error:", errorData.zodError);
        }
      }
    }
  }

  /* ── Field state helpers ── */
  const nameVal = useWatch({ control, name: "name" }) as string;
  const ageVal = useWatch({ control, name: "age" }) as string;
  const sexVal = useWatch({ control, name: "sex" }) as string;
  const cityVal = useWatch({ control, name: "city" }) as string;

  function borderColor(filled: boolean, hasError: boolean): string {
    if (hasError) return "1.5px solid #FC8181";
    if (filled) return `1.5px solid ${testColor}45`;
    return "1.5px solid oklch(0.91 0.008 220)";
  }

  function bgColor(filled: boolean): string {
    return filled ? `${testColor}04` : "white";
  }

  return (
    <div
      className="overflow-hidden rounded-3xl border bg-card"
      style={{
        borderColor: `${testColor}20`,
        boxShadow: `0 12px 48px ${testColor}10`,
      }}
    >
      {/* Accent bar */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${testColor}, ${testColor}88)`,
        }}
      />

      <div className="p-7 sm:p-9">
        {/* Privacy note */}
        <div
          className="mb-7 flex items-start gap-3 rounded-2xl p-4"
          style={{
            background: `${testColor}07`,
            border: `1px solid ${testColor}18`,
          }}
        >
          <Shield size={16} className="mt-0.5 shrink-0" style={{ color: testColor }} />
          <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
            Informasi Anda digunakan hanya untuk mempersonalisasi hasil dan tidak akan pernah
            dibagikan kepada pihak ketiga.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {/* ── Name ── */}
          <FieldWrapper
            icon={<User size={15} style={{ color: nameVal ? testColor : undefined }} />}
            label="Nama atau Inisial"
            required
            error={touchedFields.name ? errors.name?.message : undefined}
            color={testColor}
          >
            <input
              type="text"
              placeholder="cth. Alex atau A.S."
              {...register("name")}
              className="w-full rounded-[14px] px-4 py-3 text-sm text-foreground outline-none transition-colors"
              style={{
                border: borderColor(!!nameVal, !!errors.name && !!touchedFields.name),
                background: bgColor(!!nameVal),
              }}
            />
          </FieldWrapper>

          {/* ── Age (optional) ── */}
          <FieldWrapper
            icon={<Calendar size={15} style={{ color: ageVal ? testColor : undefined }} />}
            label="Usia"
            optional
            error={touchedFields.age ? errors.age?.message : undefined}
            color={testColor}
          >
            <input
              type="number"
              min={5}
              max={120}
              placeholder="cth. 24"
              {...register("age")}
              className="w-full rounded-[14px] px-4 py-3 text-sm text-foreground outline-none transition-colors"
              style={{
                border: borderColor(!!ageVal, !!errors.age && !!touchedFields.age),
                background: bgColor(!!ageVal),
              }}
            />
          </FieldWrapper>

          {/* ── Sex (segmented toggle) ── */}
          <FieldWrapper
            icon={<Users size={15} style={{ color: sexVal ? testColor : undefined }} />}
            label="Jenis Kelamin"
            required
            error={touchedFields.sex ? errors.sex?.message : undefined}
            color={testColor}
          >
            <div className="flex gap-3">
              {(["Male", "Female"] as const).map((option) => {
                const selected = sexVal === option;
                return (
                  <label
                    key={option}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-medium transition-all"
                    style={{
                      border: selected
                        ? `1.5px solid ${testColor}`
                        : "1.5px solid oklch(0.91 0.008 220)",
                      background: selected ? `${testColor}10` : "white",
                      color: selected ? testColor : "oklch(0.50 0.02 240)",
                      boxShadow: selected ? `0 2px 8px ${testColor}20` : "none",
                    }}
                  >
                    <input type="radio" value={option} {...register("sex")} className="sr-only" />
                    {option === "Male" ? "Laki-laki" : "Perempuan"}
                  </label>
                );
              })}
            </div>
          </FieldWrapper>

          {/* ── Province ── */}
          <FieldWrapper
            icon={<MapPin size={15} style={{ color: selectedProvince ? testColor : undefined }} />}
            label="Provinsi"
            required
            error={touchedFields.province ? errors.province?.message : undefined}
            color={testColor}
          >
            <select
              {...register("province")}
              className="w-full cursor-pointer appearance-none rounded-[14px] bg-no-repeat px-4 py-3 pr-10 text-sm outline-none transition-colors"
              style={{
                border: borderColor(
                  !!selectedProvince,
                  !!errors.province && !!touchedFields.province
                ),
                backgroundColor: bgColor(!!selectedProvince),
                color: selectedProvince ? undefined : "oklch(0.50 0.02 240)",
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
            </select>
          </FieldWrapper>

          {/* ── City / Regency ── */}
          <FieldWrapper
            icon={<MapPin size={15} style={{ color: cityVal ? testColor : undefined }} />}
            label="Kota / Kabupaten"
            required
            error={touchedFields.city ? errors.city?.message : undefined}
            color={testColor}
          >
            <select
              {...register("city")}
              disabled={!selectedProvince}
              className="w-full cursor-pointer appearance-none rounded-[14px] bg-no-repeat px-4 py-3 pr-10 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                border: borderColor(!!cityVal, !!errors.city && !!touchedFields.city),
                backgroundColor: bgColor(!!cityVal),
                color: cityVal ? undefined : "oklch(0.50 0.02 240)",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundPosition: "right 14px center",
              }}
            >
              <option value="">
                {selectedProvince ? "Pilih kota / kabupaten…" : "Pilih provinsi terlebih dahulu"}
              </option>
              {cities.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </FieldWrapper>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-none py-4 text-base font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: isValid
                ? `linear-gradient(135deg, ${testColor}, ${testColor}CC)`
                : "oklch(0.93 0.02 260)",
              color: isValid ? "white" : "oklch(0.70 0.03 260)",
              boxShadow: isValid ? `0 8px 28px ${testColor}35` : "none",
            }}
          >
            {isSubmitting ? "Memulai Asesmen..." : "Lanjutkan ke Asesmen"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>

          <p className="mt-1 text-center text-xs text-muted-foreground">
            Kolom wajib ditandai dengan <span style={{ color: testColor }}>*</span>
          </p>
        </form>
      </div>
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
  color,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
        {icon}
        {label}
        {required && <span style={{ color, fontSize: 14, lineHeight: 1 }}>*</span>}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground/60">(Opsional)</span>
        )}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
