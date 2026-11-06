import Link from "next/link";
import { requireIdentity, requireActor } from "@/lib/auth/session.server";
import { AccountForm } from "@/components/auth/account-form";
import { PageHeading } from "@/components/ui/page-heading";
export default async function AccountPage() {
  await requireActor();
  const { user } = await requireIdentity();
  return (
    <>
      <PageHeading
        eyebrow="Your identity"
        title="Account"
        description="Manage your display name and password."
      />
      <p className="mt-4 break-words">
        {user.email} · {user.role === "ADMIN" ? "Administrator" : "Member"}
      </p>
      <AccountForm operation="profile" name={user.name} />
      <Link
        className="font-semibold text-teal-800 underline"
        href="/account/change-password/"
      >
        Change password
      </Link>
    </>
  );
}
