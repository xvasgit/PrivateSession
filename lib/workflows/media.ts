import { z } from "zod";

export const mediaExtensions = [
  ".mp3",
  ".wav",
  ".mp4",
  ".m4v",
  ".mov",
] as const;
export interface MediaSelection {
  name: string;
  size: number;
  category: "Audio" | "Video";
}
export const mediaMetadataSchema = z.object({
  name: z
    .string({ error: "Choose a recording with a valid filename." })
    .min(1, "Choose a recording with a valid filename.")
    .refine(
      (name) =>
        mediaExtensions.some((extension) =>
          name.toLowerCase().endsWith(extension),
        ),
      "Choose an MP3, WAV, MP4, M4V, or MOV file.",
    ),
  size: z
    .number({ error: "Provide the recording size as a whole number of bytes." })
    .int("Provide a safe whole number of bytes.")
    .positive(
      "The selected file is empty or has an invalid size. Choose a non-empty recording.",
    ),
});

export type MediaValidationState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors?: Partial<Record<"name" | "size", string[]>>;
      message: string;
    }
  | { status: "success"; metadata: MediaSelection };

/** Reject missing/blank/non-decimal values before converting FormData strings. */
export function parseMediaSize(
  value: FormDataEntryValue | null,
): number | undefined {
  return typeof value === "string" && /^\d+$/.test(value)
    ? Number(value)
    : undefined;
}
export function validateMediaFile(
  file: Pick<File, "name" | "size">,
): string | undefined {
  const result = mediaMetadataSchema.safeParse({
    name: file.name,
    size: file.size,
  });
  return result.success ? undefined : result.error.issues[0].message;
}
export function describeMediaFile(
  file: Pick<File, "name" | "size">,
): MediaSelection {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return {
    name: file.name,
    size: file.size,
    category: [".mp3", ".wav"].includes(extension) ? "Audio" : "Video",
  };
}
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
