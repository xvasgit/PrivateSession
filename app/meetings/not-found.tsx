import Link from "next/link";
export default function MeetingNotFound() {
  return (
    <>
      <h1 className="text-2xl font-bold">Meeting not found</h1>
      <p className="my-4">
        This record is no longer available or the identifier is invalid.
      </p>
      <Link href="/meetings/" className="text-teal-800 underline">
        Return to meeting lab
      </Link>
    </>
  );
}
