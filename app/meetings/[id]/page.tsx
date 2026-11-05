import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDemoSession } from "@/lib/practicum/session.server";
import { getPrisma } from "@/lib/prisma";
import { positiveId } from "@/lib/meetings/schema";
import { openTranscript } from "@/lib/crypto/transcript-encryption.server";
import {
  MeetingLabBanner,
  DatabaseUnavailable,
} from "@/components/meetings/lab-banner";
import { LabForm } from "@/components/meetings/lab-form";
import { PageHeading } from "@/components/ui/page-heading";

export default async function MeetingPage({
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
          include: { segments: { orderBy: { sequence: "asc" } } },
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
  const row = result.record;
  const segments = await Promise.all(
    row.segments.map(async (segment) => {
      try {
        return {
          id: segment.id,
          sequence: segment.sequence,
          content: await openTranscript(segment, segment),
        };
      } catch {
        return { id: segment.id, sequence: segment.sequence, content: null };
      }
    }),
  );
  return (
    <>
      <MeetingLabBanner />
      <PageHeading
        eyebrow="Demo — not processed"
        title={row.title}
        description={`Session code: ${row.sessionCode}`}
      />
      <p className="mt-3">
        Created:{" "}
        <time dateTime={row.createdAt.toISOString()}>
          {row.createdAt.toISOString()}
        </time>
      </p>
      <Link
        href={`/meetings/${row.id}/edit/`}
        className="my-5 inline-block font-semibold text-teal-800 underline"
      >
        Edit meeting
      </Link>
      <h2 className="text-xl font-bold">Transcript segments</h2>
      {!segments.length && <p className="mt-4">No transcript segments yet.</p>}
      <ol className="my-5 space-y-5">
        {segments.map((segment) => (
          <li
            key={segment.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h3 className="font-bold">Segment {segment.sequence}</h3>
            {segment.content === null ? (
              <p role="alert">
                This segment could not be authenticated and decrypted. Check the
                original lab key and stored data.
              </p>
            ) : (
              <>
                <p className="my-3 whitespace-pre-wrap break-words">
                  {segment.content}
                </p>
                <details>
                  <summary className="cursor-pointer font-semibold text-teal-800">
                    Edit segment {segment.sequence}
                  </summary>
                  <p className="mt-3 text-sm">
                    The parent and sequence stay fixed. Saving encrypts the text
                    with a fresh nonce.
                  </p>
                  <LabForm
                    key={segment.content}
                    operation="updateSegment"
                    hidden={{ id: segment.id, sessionId: row.id }}
                    submit="Save segment"
                    fields={[
                      {
                        name: "content",
                        label: "Synthetic transcript text",
                        type: "textarea",
                        max: 10000,
                        value: segment.content,
                      },
                    ]}
                  />
                </details>
              </>
            )}
            <LabForm
              operation="deleteSegment"
              hidden={{ id: segment.id, sessionId: row.id }}
              submit={`Delete segment ${segment.sequence}`}
            />
          </li>
        ))}
      </ol>
      <h2 className="text-xl font-bold">Add a segment</h2>
      <LabForm
        key={`add-${segments.length}`}
        operation="createSegment"
        hidden={{ sessionId: row.id }}
        submit="Add segment"
        fields={[
          {
            name: "sequence",
            label: "Sequence number",
            type: "number",
            min: 1,
            max: 2147483647,
          },
          {
            name: "content",
            label: "Synthetic transcript text",
            type: "textarea",
            max: 10000,
          },
        ]}
      />
      <section className="mt-8 border-t border-slate-300 pt-6">
        <h2 className="text-xl font-bold">Delete meeting</h2>
        <p className="mt-3">
          Ordinary deletion is blocked while this session has segments.
        </p>
        <LabForm
          operation="deleteMeeting"
          hidden={{ id: row.id }}
          submit="Delete empty meeting"
        />
        <p>
          Deleting the session and all its segments is permanent. The database
          transaction removes both together.
        </p>
        <LabForm
          operation="deleteAll"
          hidden={{ id: row.id }}
          submit="Delete session and all segments"
          fields={[
            {
              name: "confirmation",
              label: "I confirm deletion of this session and all its segments",
              type: "checkbox",
            },
          ]}
        />
      </section>
    </>
  );
}
