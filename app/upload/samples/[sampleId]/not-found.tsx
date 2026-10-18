import Link from "next/link";

export default function ReviewSampleNotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Review example not found</h1>
      <p className="text-slate-600">
        Check the address or choose an available example.
      </p>
      <Link
        href="/upload/samples/"
        className="inline-block font-semibold text-teal-800 underline"
      >
        Back to review examples
      </Link>
    </div>
  );
}
