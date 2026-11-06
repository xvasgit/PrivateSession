import { CredentialForm } from "@/components/auth/credential-form";
import { PageHeading } from "@/components/ui/page-heading";
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const changed = (await searchParams).password === "changed";
  return (
    <>
      <PageHeading
        eyebrow="Private access"
        title="Sign in"
        description="Open your private meeting library with your account."
      />
      <p className="my-5 max-w-2xl text-sm leading-6 text-slate-600">
        Accounts are created by an administrator. Only you can access your
        meetings through this app. Sessions last up to eight hours and survive
        server restarts. Signing out does not delete meetings. Use synthetic
        data in this lab.
      </p>
      {changed && (
        <p role="status">
          Password changed. Sign in again with your new password.
        </p>
      )}
      <CredentialForm />
    </>
  );
}
