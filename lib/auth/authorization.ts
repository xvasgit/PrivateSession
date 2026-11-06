import type { Prisma } from "../../generated/prisma/client";

export type Actor = { userId: string; sessionId: string };
export class AccessDenied extends Error {
  readonly code = "ACCESS_DENIED";
  constructor() {
    super("This record or operation is not available.");
  }
}
/** Serialize protected mutations with deactivation and password changes. */
export async function verifyActor(
  tx: Prisma.TransactionClient,
  actor: Actor,
  admin = false,
) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actor.userId} FOR UPDATE`;
  const user = await tx.user.findUnique({ where: { id: actor.userId } });
  const session = await tx.session.findFirst({
    where: {
      id: actor.sessionId,
      userId: actor.userId,
      expiresAt: { gt: new Date() },
    },
  });
  if (
    !user ||
    !session ||
    user.status !== "ACTIVE" ||
    user.mustChangePassword ||
    !["MEMBER", "ADMIN"].includes(user.role) ||
    (admin && user.role !== "ADMIN")
  )
    throw new AccessDenied();
  return user;
}
