import Link from "next/link";
import { ReviewSections } from "@/components/meetings/review-sections";
import { emptyReview } from "@/lib/meetings/review";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session.server";
import { getPrisma } from "@/lib/prisma";
import { positiveId } from "@/lib/meetings/schema";
import {
  openTranscript,
  openReview,
} from "@/lib/crypto/transcript-encryption.server";
import {
  LocalAccessNotice,
  DatabaseUnavailable,
} from "@/components/meetings/local-notice";
import { MeetingActionForm } from "@/components/meetings/meeting-form";
import { PageHeading } from "@/components/ui/page-heading";

export default async function MeetingPage({
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
        <LocalAccessNotice />
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
  const review = await (async () => {
    if (row.reviewCiphertext === null && row.reviewIv === null)
      return emptyReview;
    if (!row.reviewCiphertext || !row.reviewIv) return null;
    try {
      return await openReview(
        { reviewCiphertext: row.reviewCiphertext, reviewIv: row.reviewIv },
        row.id,
      );
    } catch {
      return null;
    }
  })();
  return (
    <>
      <LocalAccessNotice />
      <PageHeading
        eyebrow="Saved meeting"
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
      <nav
        aria-label="Meeting sections"
        className="mb-6 flex flex-wrap gap-4 font-semibold text-teal-800"
      >
        <a href="#transcript" className="underline">
          Transcript
        </a>
        <a href="#summary" className="underline">
          Summary
        </a>
        <a href="#insights" className="underline">
          Insights
        </a>
        <a href="#follow-ups" className="underline">
          Follow-ups
        </a>
      </nav>
      <h2 id="transcript" className="scroll-mt-6 text-xl font-bold">
        Transcript
      </h2>
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
                original encryption key and stored data.
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
                    The segment stays in the same position when you edit its
                    text.
                  </p>
                  <MeetingActionForm
                    key={segment.content}
                    operation="updateSegment"
                    hidden={{ id: segment.id, sessionId: row.id }}
                    submit="Save segment"
                    fields={[
                      {
                        name: "content",
                        label: "Transcript text",
                        type: "textarea",
                        max: 10000,
                        value: segment.content,
                      },
                    ]}
                  />
                </details>
              </>
            )}
            <MeetingActionForm
              operation="deleteSegment"
              hidden={{ id: segment.id, sessionId: row.id }}
              submit={`Delete segment ${segment.sequence}`}
              fields={[
                {
                  name: "confirmation",
                  label: `Confirm deletion of segment ${segment.sequence}`,
                  type: "checkbox",
                },
              ]}
            />
          </li>
        ))}
      </ol>
      <h2 className="text-xl font-bold">Add a segment</h2>
      <MeetingActionForm
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
            label: "Transcript text",
            type: "textarea",
            max: 10000,
          },
        ]}
      />
      <ReviewSections meetingId={row.id} review={review} />
      <section className="mt-8 border-t border-slate-300 pt-6">
        <h2 className="text-xl font-bold">Delete meeting</h2>
        <p className="mt-3">
          You can delete an empty meeting below. For meetings with transcript
          segments, use the confirmed delete-all option.
        </p>
        <MeetingActionForm
          operation="deleteMeeting"
          hidden={{ id: row.id }}
          submit="Delete empty meeting"
          fields={[
            {
              name: "confirmation",
              label: "Confirm deletion of this empty meeting",
              type: "checkbox",
            },
          ]}
        />
        <p>
          Deleting the session and all its segments is permanent. Its transcript
          and review notes will be removed together.
        </p>
        <MeetingActionForm
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
