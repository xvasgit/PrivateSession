import type { PrismaClient } from "../../generated/prisma/client";
import type { MeetingCommand } from "./schema";
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
  seal: Seal,
  command: MeetingCommand,
): Promise<string> {
  switch (command.operation) {
    case "createMeeting": {
      const row = await db.meetingSession.create({
        data: { sessionCode: command.sessionCode, title: command.title },
      });
      return `/meetings/${row.id}/`;
    }
    case "updateMeeting":
      await db.meetingSession.update({
        where: { id: command.id },
        data: { sessionCode: command.sessionCode, title: command.title },
      });
      return `/meetings/${command.id}/`;
    case "deleteMeeting":
      await db.meetingSession.delete({ where: { id: command.id } });
      return "/meetings/";
    case "deleteAll":
      await deleteMeetingWithSegments(db, command.id);
      return "/meetings/";
    case "createSegment": {
      await db.meetingSession.findUniqueOrThrow({
        where: { id: command.sessionId },
      });
      const encrypted = await seal(command.content, command);
      await db.transcriptSegment.create({
        data: {
          sessionId: command.sessionId,
          sequence: command.sequence,
          ...encrypted,
        },
      });
      return `/meetings/${command.sessionId}/`;
    }
    case "updateSegment": {
      const row = await db.transcriptSegment.findUniqueOrThrow({
        where: { id: command.id, sessionId: command.sessionId },
      });
      const encrypted = await seal(command.content, row);
      await db.transcriptSegment.update({
        where: { id: command.id, sessionId: command.sessionId },
        data: encrypted,
      });
      return `/meetings/${command.sessionId}/`;
    }
    case "deleteSegment":
      await db.transcriptSegment.delete({
        where: { id: command.id, sessionId: command.sessionId },
      });
      return `/meetings/${command.sessionId}/`;
  }
}

export async function deleteMeetingWithSegments(db: PrismaClient, id: number) {
  return db.$transaction(async (tx) => {
    await tx.transcriptSegment.deleteMany({ where: { sessionId: id } });
    return tx.meetingSession.delete({ where: { id } });
  });
}
