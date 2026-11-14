"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readActor } from "../../lib/auth/session.server";
import { getPrisma } from "../../lib/prisma";
import {
  sealTranscript,
  sealReview,
  openReview,
} from "../../lib/crypto/transcript-encryption.server";
import { commands, type MeetingFormState } from "../../lib/meetings/schema";
import { mutateMeeting } from "../../lib/meetings/repository";
import { meetingError } from "../../lib/meetings/errors";

export async function saveMeetingCommand(
  _previous: MeetingFormState,
  form: FormData,
): Promise<MeetingFormState> {
  const actor = await readActor();
  if (!actor) return { message: "Please sign in again. No change was made." };
  const parsed = commands.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      message: "Check the meeting fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  let destination: string;
  try {
    destination = await mutateMeeting(
      getPrisma(),
      actor,
      sealTranscript,
      parsed.data,
      { seal: sealReview, open: openReview },
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;
    if (
      (parsed.data.operation === "deleteMeeting" ||
        parsed.data.operation === "deleteAll") &&
      code === "P2025"
    ) {
      console.error("Meeting deletion failed: P2025 (record not found).");
      throw new Error(
        "The meeting could not be deleted because it no longer exists.",
      );
    }
    // Never log database errors: their metadata can contain submitted values.
    return meetingError(error, parsed.data.operation);
  }
  revalidatePath("/meetings", "layout");
  if (parsed.data.operation === "saveReview")
    return { message: "Review saved." };
  if (parsed.data.operation === "updateMeeting" && !parsed.data.returnToDetail)
    return { message: "Meeting changes saved." };
  redirect(destination);
}
