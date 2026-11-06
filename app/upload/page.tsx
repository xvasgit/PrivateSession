import { UploadReview } from "@/components/upload-review";
import { PageHeading } from "@/components/ui/page-heading";
export default function UploadPage() {
  return (
    <>
      <PageHeading
        eyebrow="In progress"
        title="Upload & Review"
        description="Revisit past meetings with summaries, insights, follow-ups, and potential missed details. Recording processing is upcoming; you can already save transcripts and review notes manually."
      />
      <UploadReview />
    </>
  );
}
