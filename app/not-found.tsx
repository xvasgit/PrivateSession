import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-slate-600">
        Check the address or return to the overview.
      </p>
      <Link
        href="/"
        className="inline-block font-semibold text-teal-800 underline"
      >
        Back to overview
      </Link>
    </div>
  );
}
