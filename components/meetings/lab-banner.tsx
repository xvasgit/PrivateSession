import Link from "next/link";
import { demoSignOut } from "@/app/demo-sign-in/actions";
import { Button } from "../ui/button";

export function MeetingLabBanner() {
  return (
    <aside className="mb-6 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
      <p className="font-semibold">Module 6 lab — synthetic data only</p>
      <p>
        One shared demo account can access every lab meeting. Database records
        survive server restarts; sign-in sessions do not. Logout does not delete
        meetings. This is not a private production account.
      </p>
      <p>
        Only manually entered synthetic text is stored. Transcript text is
        encrypted at rest and decrypted by this local server for display.
        Titles, codes, sequence numbers and timestamps are not encrypted. No
        media is captured, uploaded or analyzed.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/meetings/" className="underline">
          Meeting lab
        </Link>
        <Link href="/upload/" className="underline">
          Back to Upload &amp; Review
        </Link>
        <form action={demoSignOut}>
          <Button type="submit">Log out of demo</Button>
        </form>
      </div>
    </aside>
  );
}

export function DatabaseUnavailable() {
  return (
    <p
      role="alert"
      className="my-6 rounded-xl border border-red-200 p-5 text-red-800"
    >
      The local meeting database is unavailable. Check lab configuration and
      reload to retry.
    </p>
  );
}
