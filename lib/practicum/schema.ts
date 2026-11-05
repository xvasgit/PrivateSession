import { z } from "zod";

export const meetingTypes = [
  "Online Meeting",
  "Lecture",
  "Interview",
  "Other",
] as const;
export const reviewRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Meeting title must be at least 3 characters.")
    .max(80, "Meeting title must be at most 80 characters."),
  meetingType: z.enum(meetingTypes, { error: "Choose a meeting type." }),
  context: z
    .string()
    .trim()
    .min(10, "Review context must be at least 10 characters.")
    .max(500, "Review context must be at most 500 characters."),
  confirmation: z
    .stringbool()
    .default(false)
    .refine(Boolean, "Confirm synthetic information and temporary storage."),
});
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
export const demoSignInSchema = z.object({
  email: z.email("Enter a valid demo email."),
  password: z.string().min(8, "Demo password must be at least 8 characters."),
});
export type DemoFormState = {
  fieldErrors?: Partial<
    Record<keyof ReviewRequestInput | "email" | "password", string[]>
  >;
  message?: string;
};
