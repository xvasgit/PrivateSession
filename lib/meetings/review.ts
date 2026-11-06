import { z } from "zod";
const note = z
  .string()
  .max(10000, "Use at most 10,000 characters.")
  .transform((value) => (value.trim() ? value : ""));
export const reviewSchema = z.object({
  summary: note,
  insights: note,
  followUps: note,
});
export type MeetingReview = z.infer<typeof reviewSchema>;
export const emptyReview: MeetingReview = {
  summary: "",
  insights: "",
  followUps: "",
};
export const reviewPayloadSchema = reviewSchema
  .extend({ version: z.literal(1) })
  .strict();
