"use server";

import { z } from "zod";
import {
  describeMediaFile,
  mediaMetadataSchema,
  parseMediaSize,
  type MediaValidationState,
} from "../../lib/workflows/media";

/** Public, stateless metadata validation only; grants no access and changes no data. */
export async function validateRecordingMetadata(
  formData: FormData,
): Promise<MediaValidationState> {
  const result = mediaMetadataSchema.safeParse({
    name: formData.get("name"),
    size: parseMediaSize(formData.get("size")),
  });
  if (!result.success) {
    return {
      status: "error",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      message: "Check the selected recording's filename and size.",
    };
  }
  return { status: "success", metadata: describeMediaFile(result.data) };
}
