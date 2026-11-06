import { LEGACY_USER_ID } from "../lib/auth/accounts";
import "../scripts/load-lab-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { localDatabaseUrl } from "../lib/database/lab-config";
import {
  decryptTranscript,
  encryptTranscript,
  importTranscriptKey,
} from "../lib/crypto/transcript-encryption";
import { seedMeetings } from "./data-awal";

async function main() {
  const key = await importTranscriptKey(process.env.DATA_ENCRYPTION_KEY);
  // Standalone CLI: never import the Next.js server-only client or session modules.
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: localDatabaseUrl(process.env.DATABASE_URL),
      connectionTimeoutMillis: 5000,
    }),
    log: [],
    errorFormat: "minimal",
  });
  try {
    const verified = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const fixture of seedMeetings) {
        const session = await tx.meetingSession.upsert({
          where: {
            ownerId_sessionCode: {
              ownerId: LEGACY_USER_ID,
              sessionCode: fixture.sessionCode,
            },
          },
          update: {},
          create: {
            ownerId: LEGACY_USER_ID,
            sessionCode: fixture.sessionCode,
            title: fixture.title,
          },
        });
        for (const segment of fixture.segments) {
          const identity = {
            sessionId: session.id,
            sequence: segment.sequence,
          };
          const encrypted = await encryptTranscript(
            segment.content,
            key,
            identity,
          );
          const stored = await tx.transcriptSegment.upsert({
            where: { sessionId_sequence: identity },
            update: {},
            create: { ...identity, ...encrypted },
          });
          // Existing rows are not overwritten; a changed/wrong key fails closed.
          await decryptTranscript(stored, key, identity);
          count++;
        }
      }
      return count;
    });
    console.log(
      `Seed complete: ${seedMeetings.length} synthetic sessions, ${verified} authenticated segments. Existing rows preserved.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error(
    "Lab seed failed. Check the local database, migration, and encryption-key configuration. No secrets or row contents are logged.",
  );
  process.exitCode = 1;
});
