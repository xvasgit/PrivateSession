import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
export default function LivePage() {
  return (
    <>
      <PageHeading
        eyebrow="In progress"
        title="Live Transcription"
        description="Keep real-time context relevant with your choice of microphone, system audio, and screen snapshots."
      />
      <Card>
        <h2 className="text-xl font-semibold">
          A companion for live conversations
        </h2>
        <p className="mt-4 leading-7 text-slate-600">
          Live capture and assistance are planned for a separate companion
          application running alongside your meetings. This website will be the
          place to revisit saved transcripts and reviews. The companion and
          synchronization are not available yet.
        </p>
        <ol className="my-5 list-decimal space-y-3 pl-6 text-slate-700">
          <li>
            Choose an online meeting or live recording and your capture sources.
          </li>
          <li>
            Confirm consent and check the recording indicator before capture.
          </li>
          <li>
            Follow speech and optional screen context, then choose what to sync
            to your meeting library.
          </li>
        </ol>
        <p className="mb-5 text-sm text-slate-600">
          This page does not access your devices or start a recording. Live
          follow-up assistance and prompt suggestions are planned.
        </p>
        <Link
          href="/meetings/"
          className="font-semibold text-teal-800 underline"
        >
          Open meeting library
        </Link>
      </Card>
    </>
  );
}
