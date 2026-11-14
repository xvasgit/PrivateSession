import { z } from "zod";
import { reviewSchema } from "./review";

export const positiveId = z.preprocess(
  (value) =>
    typeof value === "string" && /^[1-9]\d*$/.test(value)
      ? Number(value)
      : value,
  z.number().int().min(1).max(2147483647),
);
export const meetingSchema = z.object({
  sessionCode: z.string().trim().min(1).max(64),
  title: z.string().trim().min(3).max(80),
});
export const contentSchema = z
  .string()
  .max(10000)
  .refine((text) => text.trim().length > 0, "Enter transcript text.");
export const segmentSchema = z.object({
  sequence: positiveId,
  content: contentSchema,
});
export const confirmationSchema = (message: string) =>
  z
    .stringbool({ error: message })
    .refine((confirmed) => confirmed, { error: message });
export const commands = z.discriminatedUnion("operation", [
  reviewSchema.extend({ operation: z.literal("saveReview"), id: positiveId }),
  meetingSchema.extend({ operation: z.literal("createMeeting") }),
  meetingSchema.extend({
    operation: z.literal("updateMeeting"),
    id: positiveId,
    returnToDetail: z.stringbool().default(true),
  }),
  z.object({
    operation: z.literal("deleteMeeting"),
    id: positiveId,
    confirmation: confirmationSchema("Confirm deletion of this meeting."),
  }),
  z.object({
    operation: z.literal("deleteAll"),
    id: positiveId,
    confirmation: confirmationSchema(
      "Confirm deletion of this session and all its segments.",
    ),
  }),
  segmentSchema.extend({
    operation: z.literal("createSegment"),
    sessionId: positiveId,
  }),
  z.object({
    operation: z.literal("updateSegment"),
    id: positiveId,
    sessionId: positiveId,
    content: contentSchema,
  }),
  z.object({
    operation: z.literal("deleteSegment"),
    id: positiveId,
    sessionId: positiveId,
    confirmation: confirmationSchema("Confirm deletion of this segment."),
  }),
]);
export type MeetingInput = z.infer<typeof meetingSchema>;
export type SegmentInput = z.infer<typeof segmentSchema>;
type ParsedCommand = z.infer<typeof commands>;
type CompatCommand<T> = T extends { operation: "updateMeeting" }
  ? Omit<T, "returnToDetail"> & { returnToDetail?: boolean }
  : T extends { confirmation: boolean }
    ? Omit<T, "confirmation"> & { confirmation: boolean | "on" }
    : T;
export type MeetingCommand = CompatCommand<ParsedCommand>;
export type MeetingFormState = {
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
