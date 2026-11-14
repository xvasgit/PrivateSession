"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function MeetingError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="my-6 max-w-2xl rounded-xl border border-red-200 bg-white p-6"
    >
      <h2 className="text-xl font-bold text-slate-900">
        Meeting could not be processed
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        The requested meeting operation failed unexpectedly or the record was
        already removed in another session.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Reference code: {error.digest ?? "unavailable"}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
        <Link
          href="/meetings/"
          className="font-semibold text-teal-800 underline"
        >
          Return to meetings
        </Link>
      </div>
    </div>
  );
}
