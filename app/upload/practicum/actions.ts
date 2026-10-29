"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  reviewRequestSchema,
  type DemoFormState,
} from "../../../lib/practicum/schema";
import { readDemoSession } from "../../../lib/practicum/session.server";
import { practicumStore } from "../../../lib/practicum/store.server";

export async function createDemoRequest(
  _previous: DemoFormState,
  data: FormData,
): Promise<DemoFormState> {
  const session = await readDemoSession();
  if (!session)
    return {
      message: "Please sign in to the demo again. No request was created.",
    };
  const parsed = reviewRequestSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success)
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      message: "Check the request fields.",
    };
  let id: string;
  try {
    const record = practicumStore.createRecord(session.owner, parsed.data);
    if (!record)
      return {
        fieldErrors: {
          title: ["You already have a demo request with this title."],
        },
        message: "Choose another demo title.",
      };
    id = record.id;
  } catch {
    console.error("Demo request creation failed.");
    return { message: "Could not create the demo request. Please retry." };
  }
  revalidatePath("/upload/practicum");
  redirect(`/upload/practicum/${id}/`);
}
