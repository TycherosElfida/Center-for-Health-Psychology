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
    .min(1, { error: "Name or initials is required." })
    .max(100, { error: "Name must be under 100 characters." }),

  age: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === "") return undefined;
      const n = Number(v);
      if (Number.isNaN(n) || !Number.isInteger(n)) return undefined;
      return n;
    })
    .refine(
      (v) => v === undefined || (v >= 5 && v <= 120),
      { error: "Please enter a valid age (5–120)." },
    ),

  sex: z.enum(["Male", "Female"], {
    error: "Please select your sex.",
  }),

  province: z.string().min(1, { error: "Province is required." }),

  city: z.string().min(1, { error: "City / Regency is required." }),
});

/** Input shape — what the form fields produce (all strings). */
export type PersonalInfoInput = z.input<typeof personalInfoSchema>;

/** Output shape — after transforms (age becomes number | undefined). */
export type PersonalInfoFormData = z.output<typeof personalInfoSchema>;
