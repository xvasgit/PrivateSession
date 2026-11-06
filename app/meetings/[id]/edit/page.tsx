import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session.server";
import { getPrisma } from "@/lib/prisma";
import { positiveId } from "@/lib/meetings/schema";
import { MeetingForm } from "@/components/meetings/meeting-form";
import {
  LocalAccessNotice,
  DatabaseUnavailable,
} from "@/components/meetings/local-notice";
import { PageHeading } from "@/components/ui/page-heading";

export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  const id = positiveId.safeParse((await params).id);
  if (!id.success) notFound();
  const result = await (async () => {
    try {
      return {
        record: await getPrisma().meetingSession.findUnique({
          where: { id: id.data, ownerId: actor.userId },
        }),
      };
    } catch {
      return null;
    }
  })();
  if (!result)
    return (
      <>
        <LocalAccessNotice />
        <DatabaseUnavailable />
      </>
    );
  if (!result.record) notFound();
  return (
    <>
      <LocalAccessNotice />
      <PageHeading
        eyebrow="Meeting library"
        title="Edit meeting"
        description="Update the meeting title or its unique code. Your saved transcript and review stay with this meeting."
      />
      <MeetingForm
        record={{
          id: result.record.id,
          title: result.record.title,
          sessionCode: result.record.sessionCode,
        }}
      />
    </>
  );
}
