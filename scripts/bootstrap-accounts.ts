import "./load-lab-env";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { localDatabaseUrl } from "../lib/database/lab-config";
import { emailSchema, passwordSchema } from "../lib/auth/schemas";
import { insertCredential, LEGACY_USER_ID } from "../lib/auth/accounts";

async function main() {
  const email = emailSchema.parse(process.env.BOOTSTRAP_ADMIN_EMAIL);
  const adminPassword = passwordSchema.parse(
    process.env.BOOTSTRAP_ADMIN_PASSWORD,
  );
  const legacyPassword = passwordSchema.parse(
    process.env.LEGACY_MEMBER_PASSWORD,
  );
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: localDatabaseUrl(process.env.DATABASE_URL),
    }),
    log: [],
  });
  try {
    const [adminHash, legacyHash] = await Promise.all([
      hashPassword(adminPassword),
      hashPassword(legacyPassword),
    ]);
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(106061)`;
      const admins = await tx.user.findMany({ where: { role: "ADMIN" } });
      if (admins.length) {
        if (!admins.some((user) => user.email === email))
          throw new Error("Bootstrap identity conflict");
      } else {
        const user = await tx.user.create({
          data: {
            id: randomUUID(),
            name: "Lab administrator",
            email,
            role: "ADMIN",
            status: "ACTIVE",
            mustChangePassword: true,
          },
        });
        await insertCredential(tx, user.id, adminHash);
      }
      const legacy = await tx.user.findUniqueOrThrow({
        where: { id: LEGACY_USER_ID },
        include: { accounts: true },
      });
      if (!legacy.accounts.length) {
        await insertCredential(tx, legacy.id, legacyHash);
        await tx.user.update({
          where: { id: legacy.id },
          data: { status: "ACTIVE", mustChangePassword: true },
        });
      }
    });
    console.log(
      "Account bootstrap complete. Existing credentials/status preserved. New credentials require replacement at first sign-in.",
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Bootstrap failed. Check local setup and identity conflicts. No secrets were logged.",
  );
  process.exitCode = 1;
});
