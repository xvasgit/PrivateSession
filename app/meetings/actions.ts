"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readDemoSession } from "../../lib/practicum/session.server";
import { getPrisma } from "../../lib/prisma";
import { sealTranscript } from "../../lib/crypto/transcript-encryption.server";
import { commands, type MeetingFormState } from "../../lib/meetings/schema";
import { mutateMeeting } from "../../lib/meetings/repository";
import { meetingError } from "../../lib/meetings/errors";

export async function saveMeetingCommand(
  _previous: MeetingFormState,
  form: FormData,
): Promise<MeetingFormState> {
  if (!(await readDemoSession()))
    return { message: "Please sign in to the demo again. No change was made." };
  const parsed = commands.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      message: "Check the meeting fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  let destination: string;
  try {
    destination = await mutateMeeting(getPrisma(), sealTranscript, parsed.data);
  } catch (error) {
    // Never log database errors: their metadata can contain submitted values.
    return meetingError(error, parsed.data.operation);
  }
  revalidatePath("/meetings", "layout");
  redirect(destination);
}
