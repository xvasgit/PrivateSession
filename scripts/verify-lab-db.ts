import { LEGACY_USER_ID } from "../lib/auth/accounts";
import "./load-lab-env";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { localDatabaseUrl } from "../lib/database/lab-config";
import {
  decryptTranscript,
  importTranscriptKey,
} from "../lib/crypto/transcript-encryption";
import { seedMeetings } from "../prisma/data-awal";

async function main() {
  const key = await importTranscriptKey(process.env.DATA_ENCRYPTION_KEY);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: localDatabaseUrl(process.env.DATABASE_URL),
      connectionTimeoutMillis: 5000,
    }),
    log: [],
    errorFormat: "minimal",
  });
  try {
    if (process.argv.includes("--seed-twice")) {
      const snapshot = () =>
        prisma.meetingSession.findMany({
          where: {
            ownerId: LEGACY_USER_ID,
            sessionCode: { in: seedMeetings.map((item) => item.sessionCode) },
          },
          orderBy: { id: "asc" },
          include: { segments: { orderBy: { id: "asc" } } },
        });
      const before = await snapshot();
      assert.equal(
        before.length,
        seedMeetings.length,
        "Run the initial seed first.",
      );
      const cwd = fileURLToPath(new URL("../", import.meta.url));
      for (let run = 0; run < 2; run++) {
        execFileSync(
          process.execPath,
          ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"],
          { cwd, stdio: "pipe", windowsHide: true },
        );
        assert.deepEqual(await snapshot(), before);
      }
      console.log(
        "Seed repeated twice: IDs, counts, timestamps, ciphertext and IV unchanged.",
      );
    }
    let verified = 0;
    for (const fixture of seedMeetings) {
      const session = await prisma.meetingSession.findUniqueOrThrow({
        where: {
          ownerId_sessionCode: {
            ownerId: LEGACY_USER_ID,
            sessionCode: fixture.sessionCode,
          },
        },
        include: { segments: true },
      });
      for (const expected of fixture.segments) {
        const row = session.segments.find(
          (s) => s.sequence === expected.sequence,
        );
        if (
          !row ||
          (await decryptTranscript(row, key, row)) !== expected.content
        )
          throw new Error("Fixture verification failed.");
        if (
          Buffer.from(row.contentCiphertext).includes(
            Buffer.from(expected.content),
          )
        )
          throw new Error("Plaintext unexpectedly present.");
        verified++;
      }
    }
    console.log(
      `Verified ${seedMeetings.length} fixture sessions and ${verified} encrypted segments in a fresh process. Plaintext matches; ciphertext-only storage checked.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error(
    "Lab verification failed. Check the database, seed, and original key. No secrets or transcript contents are logged.",
  );
  process.exitCode = 1;
});
