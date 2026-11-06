import Link from "next/link";
import { requireActor } from "@/lib/auth/session.server";
import { getPrisma } from "@/lib/prisma";
import {
  LocalAccessNotice,
  DatabaseUnavailable,
} from "@/components/meetings/local-notice";
import { PageHeading } from "@/components/ui/page-heading";

export default async function MeetingsPage() {
  const actor = await requireActor();
  const records = await (async () => {
    try {
      return await getPrisma().meetingSession.findMany({
        where: { ownerId: actor.userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          title: true,
          sessionCode: true,
          createdAt: true,
          _count: { select: { segments: true } },
        },
      });
    } catch {
      return null;
    }
  })();
  return (
    <>
      <LocalAccessNotice />
      <PageHeading
        eyebrow="Your meeting library"
        title="Meetings"
        description="Keep transcripts and manually entered reviews together, ready to revisit."
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
        <p>
          No meetings yet. Create your first meeting to add a transcript and
          review notes.
        </p>
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
                {row.sessionCode} · {row._count.segments} segments ·{" "}
                <time dateTime={row.createdAt.toISOString()}>
                  {row.createdAt.toISOString().slice(0, 10)}
                </time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
