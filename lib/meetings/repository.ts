import { verifyActor, type Actor } from "../auth/authorization";
import type { PrismaClient } from "../../generated/prisma/client";
import type { MeetingCommand } from "./schema";
import type { MeetingReview } from "./review";
import type { EncryptedReview } from "../crypto/review-encryption";
import type {
  EncryptedSegment,
  SegmentIdentity,
} from "../crypto/transcript-encryption";

type Seal = (
  text: string,
  identity: SegmentIdentity,
) => Promise<EncryptedSegment>;

/** Called only after authentication and validation. Also shared by local DB tests. */
export async function mutateMeeting(
  db: PrismaClient,
  actor: Actor,
  seal: Seal,
  command: MeetingCommand,
  reviewCrypto?: {
    seal: (review: MeetingReview, id: number) => Promise<EncryptedReview>;
    open: (record: EncryptedReview, id: number) => Promise<MeetingReview>;
  },
): Promise<string> {
  return db.$transaction(async (tx) => {
    await verifyActor(tx, actor);
    const meetingId =
      "sessionId" in command
        ? command.sessionId
        : "id" in command
          ? command.id
          : undefined;
    if (meetingId !== undefined) {
      await tx.$queryRaw`SELECT id FROM "MeetingSession" WHERE id = ${meetingId} AND "ownerId" = ${actor.userId} FOR UPDATE`;
      await tx.meetingSession.findUniqueOrThrow({
        where: { id: meetingId, ownerId: actor.userId },
      });
    }
    switch (command.operation) {
      case "saveReview": {
        if (!reviewCrypto) throw new Error("Review encryption is unavailable.");
        {
          // Serialize review writes; authenticate stored content before replacing it.
          await tx.$queryRaw`SELECT id FROM "MeetingSession" WHERE id = ${command.id} FOR UPDATE`;
          const row = await tx.meetingSession.findUniqueOrThrow({
            where: { id: command.id },
          });
          if (row.reviewCiphertext !== null || row.reviewIv !== null) {
            if (!row.reviewCiphertext || !row.reviewIv)
              throw new Error("Incomplete review.");
            await reviewCrypto.open(
              {
                reviewCiphertext: row.reviewCiphertext,
                reviewIv: row.reviewIv,
              },
              row.id,
            );
          }
          const review = {
            summary: command.summary,
            insights: command.insights,
            followUps: command.followUps,
          };
          const data = Object.values(review).some(Boolean)
            ? await reviewCrypto.seal(review, command.id)
            : { reviewCiphertext: null, reviewIv: null };
          await tx.meetingSession.update({ where: { id: command.id }, data });
        }
        return `/meetings/${command.id}/`;
      }
      case "createMeeting": {
        const row = await tx.meetingSession.create({
          data: {
            ownerId: actor.userId,
            sessionCode: command.sessionCode,
            title: command.title,
          },
        });
        return `/meetings/${row.id}/`;
      }
      case "updateMeeting":
        await tx.meetingSession.update({
          where: { id: command.id },
          data: { sessionCode: command.sessionCode, title: command.title },
        });
        return `/meetings/${command.id}/`;
      case "deleteMeeting":
        await tx.meetingSession.delete({ where: { id: command.id } });
        return "/meetings/";
      case "deleteAll":
        await tx.transcriptSegment.deleteMany({
          where: { sessionId: command.id },
        });
        await tx.meetingSession.delete({
          where: { id: command.id, ownerId: actor.userId },
        });
        return "/meetings/";
      case "createSegment": {
        await tx.meetingSession.findUniqueOrThrow({
          where: { id: command.sessionId },
        });
        const encrypted = await seal(command.content, command);
        await tx.transcriptSegment.create({
          data: {
            sessionId: command.sessionId,
            sequence: command.sequence,
            ...encrypted,
          },
        });
        return `/meetings/${command.sessionId}/`;
      }
      case "updateSegment": {
        const row = await tx.transcriptSegment.findUniqueOrThrow({
          where: { id: command.id, sessionId: command.sessionId },
        });
        const encrypted = await seal(command.content, row);
        await tx.transcriptSegment.update({
          where: { id: command.id, sessionId: command.sessionId },
          data: encrypted,
        });
        return `/meetings/${command.sessionId}/`;
      }
      case "deleteSegment":
        await tx.transcriptSegment.delete({
          where: { id: command.id, sessionId: command.sessionId },
        });
        return `/meetings/${command.sessionId}/`;
    }
  });
}
