import { z } from "zod";
import { notFound } from "next/navigation";
import { requireDemoSession } from "@/lib/practicum/session.server";
import { practicumStore } from "@/lib/practicum/store.server";
import { DemoSessionBanner } from "@/components/practicum/session-banner";
import { PageHeading } from "@/components/ui/page-heading";

export default async function DemoRequestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireDemoSession();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const record = practicumStore.findRecord(session.owner, id);
  if (!record) notFound();
  return (
    <>
      <DemoSessionBanner owner={session.owner} />
      <div className="break-words">
        <PageHeading
          eyebrow="Demo — not processed"
          title={record.title}
          description="Temporary request metadata only. No analysis has been generated."
        />
      </div>
      <dl className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <dt className="font-semibold">Meeting type</dt>
        <dd>{record.meetingType}</dd>
        <dt className="font-semibold">Review context</dt>
        <dd className="whitespace-pre-wrap break-words">{record.context}</dd>
        <dt className="font-semibold">Synthetic-data confirmation</dt>
        <dd>Confirmed; not proof of participant consent.</dd>
        <dt className="font-semibold">Created (UTC)</dt>
        <dd>{record.createdAt}</dd>
      </dl>
    </>
  );
}
