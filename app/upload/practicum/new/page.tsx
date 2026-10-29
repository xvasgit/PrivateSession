import { requireDemoSession } from "@/lib/practicum/session.server";
import { DemoSessionBanner } from "@/components/practicum/session-banner";
import { DemoRequestForm } from "@/components/practicum/request-form";
import { PageHeading } from "@/components/ui/page-heading";

export default async function NewDemoRequest() {
  const session = await requireDemoSession();
  return (
    <>
      <DemoSessionBanner owner={session.owner} />
      <PageHeading
        eyebrow="Practicum only"
        title="New demo review request"
        description="Submit synthetic meeting metadata to this app’s server. No file is required. This does not upload media, reserve processing, or create durable saved work."
      />
      <DemoRequestForm />
    </>
  );
}
