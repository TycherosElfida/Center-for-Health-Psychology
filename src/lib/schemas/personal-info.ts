/**
 * Personal Information — Zod v4 Schema
 *
 * Validates demographic data collected before assessment.
 * Age is intentionally optional; sex is strictly binary per
 * clinical normative data constraints.
 */

import { z } from "zod";

export const personalInfoSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Nama atau inisial wajib diisi." })
    .max(100, { error: "Nama harus kurang dari 100 karakter." }),

  age: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === "") return undefined;
      const n = Number(v);
      if (Number.isNaN(n) || !Number.isInteger(n)) return undefined;
      return n;
    })
    .refine((v) => v === undefined || (v >= 5 && v <= 120), {
      error: "Masukkan usia yang valid (5–120).",
    }),

  sex: z.enum(["Male", "Female"], {
    error: "Pilih jenis kelamin Anda.",
  }),

  province: z.string().min(1, { error: "Provinsi wajib dipilih." }),

  city: z.string().min(1, { error: "Kota / Kabupaten wajib dipilih." }),
});

/** Input shape — what the form fields produce (all strings). */
export type PersonalInfoInput = z.input<typeof personalInfoSchema>;

/** Output shape — after transforms (age becomes number | undefined). */
export type PersonalInfoFormData = z.output<typeof personalInfoSchema>;
