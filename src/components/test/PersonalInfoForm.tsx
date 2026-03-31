"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
}

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function PersonalInfoForm({ testSlug, testColor }: PersonalInfoFormProps) {
  const router = useRouter();
  const provinces = getProvinces();

  const {
    register,
    handleSubmit,
    control,
    resetField,
    formState: { errors, isValid, touchedFields },
  } = useForm<PersonalInfoInput, unknown, PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      age: "",
      sex: undefined,
      province: "",
      city: "",
    },
  });

  /* ── Cascading: reset city when province changes ── */
  const selectedProvince = useWatch({ control, name: "province" }) as string;
  const cities = selectedProvince ? getCitiesByProvince(selectedProvince) : [];

  useEffect(() => {
    if (selectedProvince) {
      resetField("city", { defaultValue: "" });
    }
  }, [selectedProvince, resetField]);

  /* ── Submit handler ── */
  const startSession = trpc.sessions.startSession.useMutation({
    onSuccess: (data) => {
      router.push(`/test/${testSlug}?sessionId=${data.sessionId}`);
    },
    onError: (err) => {
      console.error("[PersonalInfoForm] Failed to start session:", err.message);
    },
  });

  function onSubmit(data: PersonalInfoFormData) {
    localStorage.setItem(`chp_personal_${testSlug}`, JSON.stringify(data));
    startSession.mutate({ testSlug });
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
            Your information is used solely to personalise your results and is never shared with
            third parties.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {/* ── Name ── */}
          <FieldWrapper
            icon={<User size={15} style={{ color: nameVal ? testColor : undefined }} />}
            label="Name or Initials"
            required
            error={touchedFields.name ? errors.name?.message : undefined}
            color={testColor}
          >
            <input
              type="text"
              placeholder="e.g. Alex or A.S."
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
            label="Age"
            optional
            error={touchedFields.age ? errors.age?.message : undefined}
            color={testColor}
          >
            <input
              type="number"
              min={5}
              max={120}
              placeholder="e.g. 24"
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
            label="Sex"
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
                    {option}
                  </label>
                );
              })}
            </div>
          </FieldWrapper>

          {/* ── Province ── */}
          <FieldWrapper
            icon={<MapPin size={15} style={{ color: selectedProvince ? testColor : undefined }} />}
            label="Province"
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
              <option value="">Select province…</option>
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
            label="City / Regency"
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
                {selectedProvince ? "Select city / regency…" : "Select province first"}
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
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-none py-4 text-base font-bold transition-all"
            style={{
              background: isValid
                ? `linear-gradient(135deg, ${testColor}, ${testColor}CC)`
                : "oklch(0.93 0.02 260)",
              color: isValid ? "white" : "oklch(0.70 0.03 260)",
              boxShadow: isValid ? `0 8px 28px ${testColor}35` : "none",
            }}
          >
            Continue to Assessment
            <ArrowRight size={18} />
          </button>

          <p className="mt-1 text-center text-xs text-muted-foreground">
            Required fields are marked with <span style={{ color: testColor }}>*</span>
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
          <span className="text-xs font-normal text-muted-foreground/60">(Optional)</span>
        )}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
