import type { Metadata } from "next";
import { ReviewSampleList } from "@/components/review-sample-list";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Review examples | PrivateSession" };

export default function ReviewSamplesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Synthetic preview"
        title="Review examples"
        description="Explore summaries, insights, follow-ups, and potential missed details in two fictional conversations. These examples are independent of any selected recording."
      />
      <ReviewSampleList />
    </>
  );
}
