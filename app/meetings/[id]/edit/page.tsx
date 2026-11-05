import { notFound } from "next/navigation";
import { requireDemoSession } from "@/lib/practicum/session.server";
import { getPrisma } from "@/lib/prisma";
import { positiveId } from "@/lib/meetings/schema";
import { MeetingForm } from "@/components/meetings/lab-form";
import {
  MeetingLabBanner,
  DatabaseUnavailable,
} from "@/components/meetings/lab-banner";
import { PageHeading } from "@/components/ui/page-heading";

export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDemoSession();
  const id = positiveId.safeParse((await params).id);
  if (!id.success) notFound();
  const result = await (async () => {
    try {
      return {
        record: await getPrisma().meetingSession.findUnique({
          where: { id: id.data },
        }),
      };
    } catch {
      return null;
    }
  })();
  if (!result)
    return (
      <>
        <MeetingLabBanner />
        <DatabaseUnavailable />
      </>
    );
  if (!result.record) notFound();
  return (
    <>
      <MeetingLabBanner />
      <PageHeading
        eyebrow="Synthetic metadata"
        title="Edit meeting"
        description="Changing title or code keeps the numeric identity used to authenticate encrypted segments."
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
