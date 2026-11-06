import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "../../generated/prisma/client";
export async function fixtureUser(
  db: PrismaClient,
  role = "MEMBER",
  mustChangePassword = false,
) {
  const id = randomUUID();
  const password = randomUUID();
  const user = await db.user.create({
    data: {
      id,
      name: "Synthetic access user",
      email: `${id}@example.invalid`,
      role,
      mustChangePassword,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  return { ...user, password };
}
export async function fixtureActor(db: PrismaClient, userId: string) {
  const row = await db.session.create({
    data: {
      id: randomUUID(),
      userId,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return { userId, sessionId: row.id };
}
export async function removeFixtureUser(db: PrismaClient, userId: string) {
  await db.$transaction(async (tx) => {
    await tx.transcriptSegment.deleteMany({
      where: { session: { ownerId: userId } },
    });
    await tx.meetingSession.deleteMany({ where: { ownerId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}
