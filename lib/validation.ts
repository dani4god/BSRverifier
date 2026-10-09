import { z } from "zod";
export const certificateTypes = [
  "First School Leaving Certificate",
  "Basic Education Certificate",
  "University",
  "Polytechnic",
  "College of Education",
] as const;
export const numberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z0-9][A-Z0-9/-]{5,63}$/,
    "Use 6–64 letters, numbers, slashes or hyphens.",
  );
const text = z.string().trim().min(2).max(160);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const d = new Date(value + "T00:00:00Z");
    return (
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === value &&
      value <= new Date().toISOString().slice(0, 10)
    );
  }, "Enter a valid date that is not in the future.");
export const certificateInput = z
  .object({
    certificateNumber: numberSchema,
    candidateName: text,
    examNumber: text,
    examCenter: text,
    dateOfBirth: date,
    isVerified: z.boolean(),
    examDate: date,
    issuedDate: date,
    certificateType: z.enum(certificateTypes),
    institution: text,
  })
  .strict()
  .refine(
    (v) => v.dateOfBirth <= v.examDate && v.examDate <= v.issuedDate,
    "Birth date must precede exam date; issue date must be on or after exam date.",
  );
export type CertificateData = z.infer<typeof certificateInput>;
export const publicFields =
  "certificateNumber candidateName examNumber examCenter dateOfBirth isVerified examDate issuedDate certificateType institution -_id";
