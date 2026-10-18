import type { ReactNode } from "react";
import { ReviewNote } from "@/components/review-note";

export default function ReviewSamplesTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <ReviewNote label="Current review note" />
      {children}
    </div>
  );
}
