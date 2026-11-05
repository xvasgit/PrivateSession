import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { practicumStore, SESSION_SECONDS } from "./store.server";

export const DEMO_COOKIE = "private-session-demo";
export function demoCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}
export async function readDemoSession() {
  return practicumStore.readSession((await cookies()).get(DEMO_COOKIE)?.value);
}
export async function requireDemoSession() {
  const session = await readDemoSession();
  if (!session) redirect("/demo-sign-in/");
  return session;
}
export async function createDemoSession(owner: string) {
  const jar = await cookies();
  const id = practicumStore.createSession(owner, jar.get(DEMO_COOKIE)?.value);
  jar.set(DEMO_COOKIE, id, demoCookieOptions());
}
export async function deleteDemoSession() {
  const jar = await cookies();
  practicumStore.revokeSession(jar.get(DEMO_COOKIE)?.value);
  jar.set(DEMO_COOKIE, "", { ...demoCookieOptions(), maxAge: 0 });
}
