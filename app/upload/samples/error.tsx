"use client";

import { Button } from "@/components/ui/button";

export default function ReviewSamplesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="space-y-4 rounded-xl border border-red-200 bg-white p-5"
    >
      <h2 className="text-lg font-semibold">
        Review examples could not be loaded
      </h2>
      <p>Try again or return to Upload &amp; Review.</p>
      {error.digest && (
        <p className="break-all text-sm">Reference: {error.digest}</p>
      )}
      <Button type="button" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
