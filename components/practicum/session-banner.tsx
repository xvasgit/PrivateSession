import Link from "next/link";
import { demoSignOut } from "@/app/demo-sign-in/actions";
import { Button } from "../ui/button";

export function DemoSessionBanner({ owner }: { owner: string }) {
  return (
    <aside className="mb-6 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
      <p className="font-semibold">Practicum demo · Synthetic data only</p>
      <p>
        Signed in as {owner}. Records and sessions are temporary and disappear
        when this server restarts. Logout revokes access but does not delete
        this account’s temporary records. This single shared lab account is not
        a private production account.
      </p>
      <p>No media is uploaded and no analysis is scheduled.</p>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/upload/practicum/" className="underline">
          Demo requests
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
