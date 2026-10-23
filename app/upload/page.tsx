import Link from "next/link";
import { UploadReview } from "@/components/upload-review";
import { PageHeading } from "@/components/ui/page-heading";
export default function UploadPage() {
  return (
    <>
      <PageHeading
        eyebrow="In progress"
        title="Upload & Review"
        description="Turn past meeting recordings into summaries, insights, follow-ups, and potential missed details. Processing is being built; today you can select a file and explore an independent synthetic review."
      />
      <UploadReview />
      <p className="mt-8">
        <Link
          href="/upload/samples/"
          className="font-semibold text-teal-800 underline underline-offset-4"
        >
          Browse review examples
        </Link>
      </p>
    </>
  );
}
