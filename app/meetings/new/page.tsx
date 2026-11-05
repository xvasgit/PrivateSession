import { requireDemoSession } from "@/lib/practicum/session.server";
import { MeetingLabBanner } from "@/components/meetings/lab-banner";
import { MeetingForm } from "@/components/meetings/lab-form";
import { PageHeading } from "@/components/ui/page-heading";

export default async function NewMeetingPage() {
  await requireDemoSession();
  return (
    <>
      <MeetingLabBanner />
      <PageHeading
        eyebrow="Synthetic metadata"
        title="New meeting"
        description="Use a unique, case-sensitive session code. Creating a meeting does not schedule processing."
      />
      <MeetingForm />
    </>
  );
}
