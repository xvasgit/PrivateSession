import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());
export const nameSchema = z.string().trim().min(2).max(80);
export const passwordSchema = z.string().min(12).max(128);
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const createMemberSchema = signInSchema
  .extend({ name: nameSchema })
  .strict();
export const profileSchema = z.object({ name: nameSchema }).strict();
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmation: passwordSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmation)
      ctx.addIssue({
        code: "custom",
        path: ["confirmation"],
        message: "Passwords must match.",
      });
    if (
      data.currentPassword.normalize("NFKC") ===
      data.newPassword.normalize("NFKC")
    )
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Choose a different password.",
      });
  });
export const statusSchema = z
  .object({
    userId: z.string().min(1).max(128),
    status: z.enum(["ACTIVE", "DISABLED"]),
  })
  .strict();
export type AccountFormState = {
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
};
