import Link from "next/link";
import { reviewSamples } from "@/lib/workflows/review-samples.server";

export function ReviewSampleList() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {reviewSamples.map((sample) => (
        <li
          key={sample.id}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold">
            <Link
              href={`/upload/samples/${sample.id}/`}
              className="text-teal-800 underline underline-offset-4"
            >
              {sample.title}
            </Link>
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {sample.sections[0].items[0]}
          </p>
        </li>
      ))}
    </ul>
  );
}
