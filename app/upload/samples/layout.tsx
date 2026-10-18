import Link from "next/link";
import type { ReactNode } from "react";
import { ReviewNote } from "@/components/review-note";

export default function ReviewSamplesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside aria-label="Review examples panel" className="min-w-0 space-y-4">
        <p className="font-semibold">Explore sample reviews</p>
        <p className="text-sm leading-6 text-slate-600">
          These are fictional examples, not saved meetings. Workspace notes stay
          while you browse examples. Current review notes clear when you switch
          pages. All notes are temporary and disappear on reload.
        </p>
        <ReviewNote label="Review workspace note" />
        <Link
          href="/upload/"
          className="inline-block text-sm font-semibold text-teal-800 underline"
        >
          Back to Upload &amp; Review
        </Link>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
