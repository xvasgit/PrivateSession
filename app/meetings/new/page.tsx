import { requireActor } from "@/lib/auth/session.server";
import { LocalAccessNotice } from "@/components/meetings/local-notice";
import { MeetingForm } from "@/components/meetings/meeting-form";
import { PageHeading } from "@/components/ui/page-heading";

export default async function NewMeetingPage() {
  await requireActor();
  return (
    <>
      <LocalAccessNotice />
      <PageHeading
        eyebrow="Meeting library"
        title="New meeting"
        description="Give your meeting a title and a unique session code. Then paste a transcript and add your review notes."
      />
      <MeetingForm />
    </>
  );
}
