import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient, Prisma } from "../../generated/prisma/client";
import { AccessDenied, verifyActor, type Actor } from "./authorization";
import { createMemberSchema, profileSchema, statusSchema } from "./schemas";

export const LEGACY_USER_ID = "legacy-lab-member";
export const LEGACY_EMAIL = "legacy-lab@example.invalid";

export async function insertCredential(
  tx: Prisma.TransactionClient,
  userId: string,
  passwordHash: string,
) {
  await tx.account.create({
    data: {
      id: randomUUID(),
      userId,
      accountId: userId,
      providerId: "credential",
      password: passwordHash,
    },
  });
}

export async function createMember(
  db: PrismaClient,
  actor: Actor,
  input: unknown,
) {
  const data = createMemberSchema.parse(input);
  // Authorization is checked before expensive hashing and again within the mutation.
  await db.$transaction((tx) => verifyActor(tx, actor, true));
  const passwordHash = await hashPassword(data.password);
  return db.$transaction(async (tx) => {
    await verifyActor(tx, actor, true);
    const user = await tx.user.create({
      data: {
        id: randomUUID(),
        name: data.name,
        email: data.email,
        role: "MEMBER",
        status: "ACTIVE",
        mustChangePassword: true,
      },
    });
    await insertCredential(tx, user.id, passwordHash);
    return { id: user.id };
  });
}

export async function updateProfile(
  db: PrismaClient,
  actor: Actor,
  input: unknown,
) {
  const data = profileSchema.parse(input);
  await db.$transaction(async (tx) => {
    await verifyActor(tx, actor);
    await tx.user.update({ where: { id: actor.userId }, data });
  });
}

export async function setMemberStatus(
  db: PrismaClient,
  actor: Actor,
  input: unknown,
) {
  const data = statusSchema.parse(input);
  await db.$transaction(async (tx) => {
    await verifyActor(tx, actor, true);
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${data.userId} FOR UPDATE`;
    const target = await tx.user.findUnique({ where: { id: data.userId } });
    if (!target || target.role !== "MEMBER" || target.id === actor.userId)
      throw new AccessDenied();
    await tx.user.update({
      where: { id: target.id },
      data: { status: data.status },
    });
    // Reactivation never restores a previously issued session.
    await tx.session.deleteMany({ where: { userId: target.id } });
  });
}
