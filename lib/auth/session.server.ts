import "server-only";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getAuth } from "./server";
import { getPrisma } from "../prisma";
import type { Actor } from "./authorization";

export async function readIdentity() {
  try {
    const session = await getAuth().api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });
    if (!session) return null;
    const user = await getPrisma().user.findUnique({
      where: { id: session.user.id },
    });
    if (
      !user ||
      user.status !== "ACTIVE" ||
      !["MEMBER", "ADMIN"].includes(user.role)
    )
      return null;
    return {
      user,
      actor: { userId: user.id, sessionId: session.session.id } satisfies Actor,
    };
  } catch {
    return null;
  }
}
export async function readActor() {
  const identity = await readIdentity();
  return identity && !identity.user.mustChangePassword ? identity.actor : null;
}
export async function requireIdentity() {
  const identity = await readIdentity();
  if (!identity) redirect("/sign-in/");
  return identity;
}
export async function requireActor() {
  const identity = await requireIdentity();
  if (identity.user.mustChangePassword) redirect("/account/change-password/");
  return identity.actor;
}
export async function requireAdmin() {
  const identity = await requireIdentity();
  if (identity.user.mustChangePassword) redirect("/account/change-password/");
  if (identity.user.role !== "ADMIN") notFound();
  return identity.actor;
}
