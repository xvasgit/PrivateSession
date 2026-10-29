import Link from "next/link";
import { requireDemoSession } from "@/lib/practicum/session.server";
import { practicumStore } from "@/lib/practicum/store.server";
import { DemoSessionBanner } from "@/components/practicum/session-banner";
import { PageHeading } from "@/components/ui/page-heading";

export default async function DemoRequestList() {
  const session = await requireDemoSession();
  const records = practicumStore.listRecords(session.owner);
  return (
    <>
      <DemoSessionBanner owner={session.owner} />
      <PageHeading
        eyebrow="Temporary records"
        title="Demo review requests"
        description="Only requests created for this demo account are listed. They are not saved meetings or analysis results."
      />
      <Link
        className="mt-6 inline-block font-semibold text-teal-800 underline"
        href="/upload/practicum/new/"
      >
        New demo request
      </Link>
      {records.length ? (
        <ul className="mt-6 space-y-3">
          {records.map((record) => (
            <li
              key={record.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <Link
                href={`/upload/practicum/${record.id}/`}
                className="break-words font-semibold text-teal-800 underline"
              >
                {record.title}
              </Link>
              <p className="text-sm text-slate-600">
                {record.meetingType} · Demo — not processed
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6">No demo requests yet.</p>
      )}
    </>
  );
}
