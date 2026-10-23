import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findReviewSample,
  reviewSamples,
} from "@/lib/workflows/review-samples.server";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";

export function generateStaticParams() {
  return reviewSamples.map((sample) => ({ sampleId: String(sample.id) }));
}

export default async function ReviewSamplePage({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) {
  const { sampleId } = await params;
  if (!/^[1-9]\d*$/.test(sampleId)) notFound();
  const id = Number(sampleId);
  if (!Number.isSafeInteger(id)) notFound();
  const sample = findReviewSample(id);
  if (!sample) notFound();

  return (
    <>
      <PageHeading
        eyebrow="Synthetic preview"
        title={sample.title}
        description="A fictional review, unrelated to your selected file. Potential gaps are review prompts, not verified facts."
      />
      <div className="space-y-4">
        {sample.sections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-slate-600">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-4 font-semibold text-teal-800">
        <Link href="/upload/samples/" className="underline">
          Back to review examples
        </Link>
        {reviewSamples
          .filter((other) => other.id !== id)
          .map((other) => (
            <Link
              key={other.id}
              href={`/upload/samples/${other.id}/`}
              className="underline"
            >
              {other.title}
            </Link>
          ))}
      </div>
    </>
  );
}
