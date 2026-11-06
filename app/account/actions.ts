"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readActor } from "@/lib/auth/session.server";
import {
  createMember,
  updateProfile,
  setMemberStatus,
} from "@/lib/auth/accounts";
import { getPrisma } from "@/lib/prisma";
import type { AccountFormState } from "@/lib/auth/schemas";

export async function accountCommand(
  _previous: AccountFormState,
  form: FormData,
): Promise<AccountFormState> {
  const actor = await readActor();
  if (!actor)
    return {
      message: "Please sign in and replace your initial password first.",
    };
  const { operation, ...input } = Object.fromEntries(
    [...form.entries()].filter(([key]) => !key.startsWith("$ACTION_")),
  );
  try {
    if (operation === "createMember")
      await createMember(getPrisma(), actor, input);
    else if (operation === "profile")
      await updateProfile(getPrisma(), actor, input);
    else if (operation === "status")
      await setMemberStatus(getPrisma(), actor, input);
    else return { message: "This operation is not available." };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        message: "Check the fields.",
        fieldErrors: z.flattenError(error).fieldErrors,
      };
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    )
      return {
        message: "This email is unavailable.",
        fieldErrors: { email: ["This email is unavailable."] },
      };
    return {
      message: "This operation is not available. Check your access or retry.",
    };
  }
  revalidatePath("/", "layout");
  return {
    success: true,
    message:
      operation === "createMember"
        ? "Member created. Share the initial password privately; replacement is required on first sign-in."
        : "Changes saved.",
  };
}
