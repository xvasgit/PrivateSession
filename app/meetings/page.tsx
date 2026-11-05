import Link from "next/link";
import { requireDemoSession } from "@/lib/practicum/session.server";
import { getPrisma } from "@/lib/prisma";
import {
  MeetingLabBanner,
  DatabaseUnavailable,
} from "@/components/meetings/lab-banner";
import { PageHeading } from "@/components/ui/page-heading";

export default async function MeetingsPage() {
  await requireDemoSession();
  const records = await (async () => {
    try {
      return await getPrisma().meetingSession.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          title: true,
          sessionCode: true,
          _count: { select: { segments: true } },
        },
      });
    } catch {
      return null;
    }
  })();
  return (
    <>
      <MeetingLabBanner />
      <PageHeading
        eyebrow="Persistent local lab"
        title="Meeting sessions"
        description="Create synthetic sessions and manage their encrypted transcript segments."
      />
      <Link
        href="/meetings/new/"
        className="my-6 inline-block font-semibold text-teal-800 underline"
      >
        New meeting
      </Link>
      {records === null ? (
        <DatabaseUnavailable />
      ) : records.length === 0 ? (
        <p>No lab meetings yet.</p>
      ) : (
        <ul className="space-y-4">
          {records.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <Link
                href={`/meetings/${row.id}/`}
                className="break-words font-semibold text-teal-800 underline"
              >
                {row.title}
              </Link>
              <p className="break-words">
                {row.sessionCode} · {row._count.segments} segments
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
