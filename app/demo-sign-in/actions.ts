"use server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import {
  demoSignInSchema,
  type DemoFormState,
} from "../../lib/practicum/schema";
import {
  createDemoSession,
  deleteDemoSession,
} from "../../lib/practicum/session.server";

function sameSecret(a: string, b: string) {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}
export async function demoSignIn(
  _previous: DemoFormState,
  data: FormData,
): Promise<DemoFormState> {
  const config = demoSignInSchema.safeParse({
    email: process.env.DEMO_EMAIL,
    password: process.env.DEMO_PASSWORD,
  });
  if (!config.success)
    return {
      message:
        "Demo sign-in is not configured. Ask the lab operator to configure the synthetic account.",
    };
  const parsed = demoSignInSchema.safeParse({
    email: data.get("email"),
    password: data.get("password"),
  });
  if (!parsed.success)
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      message: "Check the demo credentials.",
    };
  if (
    !sameSecret(parsed.data.email, config.data.email) ||
    !sameSecret(parsed.data.password, config.data.password)
  )
    return { message: "Demo email or password is incorrect." };
  try {
    await createDemoSession(config.data.email);
  } catch {
    console.error("Demo session creation failed.");
    return { message: "Could not start the demo session. Please retry." };
  }
  redirect("/upload/practicum/");
}
export async function demoSignOut() {
  await deleteDemoSession();
  redirect("/");
}
