import "./load-lab-env";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { localDatabaseUrl } from "../lib/database/lab-config";
import {
  decryptTranscript,
  encryptTranscript,
  importTranscriptKey,
} from "../lib/crypto/transcript-encryption";
import { mutateMeeting } from "../lib/meetings/repository";

async function main() {
  const url = localDatabaseUrl(process.env.DATABASE_URL);
  if (decodeURIComponent(new URL(url).pathname) !== "/privatesession_dev")
    throw new Error("Use the dedicated development lab database.");
  const key = await importTranscriptKey(process.env.DATA_ENCRYPTION_KEY);
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      connectionTimeoutMillis: 5000,
    }),
    log: [],
    errorFormat: "minimal",
  });
  const prefix = `M06-TEST-${randomUUID()}`;
  const ids: number[] = [];
  let passed = 0;
  const seal = (
    text: string,
    identity: { sessionId: number; sequence: number },
  ) => encryptTranscript(text, key, identity);
  const run = async (name: string, task: () => Promise<void>) => {
    await task();
    passed++;
    console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
  };
  const snapshot = () =>
    db.meetingSession.findMany({
      where: { id: { in: ids } },
      orderBy: { id: "asc" },
      include: { segments: { orderBy: { id: "asc" } } },
    });
  let id = 0;
  let segmentId = 0;
  try {
    await run("create session through shared mutation", async () => {
      const path = await mutateMeeting(db, seal, {
        operation: "createMeeting",
        sessionCode: prefix,
        title: "Synthetic integration meeting",
      });
      id = Number(path.split("/")[2]);
      ids.push(id);
      assert.ok(id > 0);
    });
    await run("list and detail read", async () => {
      const rows = await snapshot();
      assert.equal(rows.length, 1);
      assert.equal(rows[0].id, id);
      assert.equal(rows[0].segments.length, 0);
    });
    await run("update session metadata", async () => {
      await mutateMeeting(db, seal, {
        operation: "updateMeeting",
        id,
        title: "Updated synthetic meeting",
        sessionCode: `${prefix}-edit`,
      });
      assert.equal((await snapshot())[0].title, "Updated synthetic meeting");
    });
    await run("create encrypted child", async () => {
      await mutateMeeting(db, seal, {
        operation: "createSegment",
        sessionId: id,
        sequence: 1,
        content: "Synthetic text — preserved \n",
      });
      const row = (await snapshot())[0].segments[0];
      segmentId = row.id;
      assert.equal(row.iv.length, 12);
      assert.ok(
        !Buffer.from(row.contentCiphertext).includes(
          Buffer.from("Synthetic text"),
        ),
      );
    });
    await run("authenticate exact child text", async () => {
      const row = (await snapshot())[0].segments[0];
      assert.equal(
        await decryptTranscript(row, key, row),
        "Synthetic text — preserved \n",
      );
    });
    await run("update child with fresh IV and unchanged identity", async () => {
      const before = (await snapshot())[0].segments[0];
      await mutateMeeting(db, seal, {
        operation: "updateSegment",
        id: segmentId,
        sessionId: id,
        content: "Updated synthetic transcript",
      });
      const after = (await snapshot())[0].segments[0];
      assert.notDeepEqual(before.iv, after.iv);
      assert.equal(after.sequence, 1);
      assert.equal(
        await decryptTranscript(after, key, after),
        "Updated synthetic transcript",
      );
    });
    await run("P2002 duplicate code and sequence", async () => {
      await assert.rejects(
        mutateMeeting(db, seal, {
          operation: "createMeeting",
          sessionCode: `${prefix}-edit`,
          title: "Duplicate synthetic",
        }),
        { code: "P2002" },
      );
      await assert.rejects(
        mutateMeeting(db, seal, {
          operation: "createSegment",
          sessionId: id,
          sequence: 1,
          content: "Duplicate synthetic",
        }),
        { code: "P2002" },
      );
    });
    await run(
      "P2003 missing parent and RESTRICT non-empty parent",
      async () => {
        const absent = await db.meetingSession.create({
          data: {
            sessionCode: `${prefix}-absent`,
            title: "Temporary synthetic",
          },
        });
        ids.push(absent.id);
        await db.meetingSession.delete({ where: { id: absent.id } });
        await assert.rejects(
          db.transcriptSegment.create({
            data: {
              sessionId: absent.id,
              sequence: 1,
              ...(await seal("Synthetic orphan", {
                sessionId: absent.id,
                sequence: 1,
              })),
            },
          }),
          { code: "P2003" },
        );
        await assert.rejects(
          mutateMeeting(db, seal, { operation: "deleteMeeting", id }),
          { code: "P2003" },
        );
      },
    );
    await run("rollback restores IDs, counts, ciphertext and IV", async () => {
      const before = await snapshot();
      const fingerprint = (rows: typeof before) =>
        createHash("sha256").update(JSON.stringify(rows)).digest("hex");
      console.log(
        `Rollback before: ${before.length} sessions / ${before.flatMap((row) => row.segments).length} segments; snapshot SHA-256 ${fingerprint(before)}`,
      );
      await assert.rejects(
        db.$transaction(async (tx) => {
          await tx.transcriptSegment.deleteMany({ where: { sessionId: id } });
          assert.equal(
            await tx.transcriptSegment.count({ where: { sessionId: id } }),
            0,
          );
          throw new Error("Intentional test-only rollback");
        }),
        /Intentional test-only rollback/,
      );
      const after = await snapshot();
      assert.deepEqual(after, before);
      console.log(
        `Rollback after: ${after.length} sessions / ${after.flatMap((row) => row.segments).length} segments; snapshot SHA-256 ${fingerprint(after)}`,
      );
    });
    await run(
      "P2025 child cannot be changed under a different parent",
      async () => {
        const other = await db.meetingSession.create({
          data: {
            sessionCode: `${prefix}-other`,
            title: "Other synthetic session",
          },
        });
        ids.push(other.id);
        await assert.rejects(
          mutateMeeting(db, seal, {
            operation: "updateSegment",
            id: segmentId,
            sessionId: other.id,
            content: "Invalid reassignment",
          }),
          { code: "P2025" },
        );
        await assert.rejects(
          mutateMeeting(db, seal, {
            operation: "deleteSegment",
            id: segmentId,
            sessionId: other.id,
          }),
          { code: "P2025" },
        );
      },
    );
    await run("delete child and reject stale update with P2025", async () => {
      await mutateMeeting(db, seal, {
        operation: "deleteSegment",
        id: segmentId,
        sessionId: id,
      });
      assert.equal(
        (await snapshot()).find((r) => r.id === id)!.segments.length,
        0,
      );
      await assert.rejects(
        mutateMeeting(db, seal, {
          operation: "updateSegment",
          id: segmentId,
          sessionId: id,
          content: "Stale synthetic edit",
        }),
        { code: "P2025" },
      );
    });
    await run(
      "delete empty parent and reject stale parent update",
      async () => {
        const other = ids.at(-1)!;
        await mutateMeeting(db, seal, {
          operation: "deleteMeeting",
          id: other,
        });
        await assert.rejects(
          mutateMeeting(db, seal, {
            operation: "updateMeeting",
            id: other,
            sessionCode: `${prefix}-stale`,
            title: "Stale synthetic title",
          }),
          { code: "P2025" },
        );
      },
    );
    await run("transaction deletes parent and children together", async () => {
      await mutateMeeting(db, seal, {
        operation: "createSegment",
        sessionId: id,
        sequence: 2,
        content: "Synthetic transaction segment",
      });
      await mutateMeeting(db, seal, {
        operation: "deleteAll",
        id,
        confirmation: "on",
      });
      assert.equal(await db.meetingSession.count({ where: { id } }), 0);
      assert.equal(
        await db.transcriptSegment.count({ where: { sessionId: id } }),
        0,
      );
    });
    console.log(
      `Database scenarios: ${passed}/13 passed. Only this run's synthetic fixtures were used.`,
    );
  } finally {
    try {
      // Explicit IDs plus a run-unique code guard; never reset or delete seed/user rows.
      await db.$transaction(async (tx) => {
        const owned = await tx.meetingSession.findMany({
          where: { id: { in: ids }, sessionCode: { startsWith: prefix } },
          select: { id: true },
        });
        const ownIds = owned.map((row) => row.id);
        await tx.transcriptSegment.deleteMany({
          where: { sessionId: { in: ownIds } },
        });
        await tx.meetingSession.deleteMany({ where: { id: { in: ownIds } } });
      });
    } finally {
      await db.$disconnect();
    }
  }
}
main().catch(() => {
  console.error(
    "Database scenario failed. No credentials, field values, or raw database errors are logged. Review the last PASS label and local configuration.",
  );
  process.exitCode = 1;
});
