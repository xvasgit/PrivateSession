import { requireIdentity } from "@/lib/auth/session.server";
import { CredentialForm } from "@/components/auth/credential-form";
import { PageHeading } from "@/components/ui/page-heading";
export default async function ChangePasswordPage() {
  const { user } = await requireIdentity();
  return (
    <>
      <PageHeading
        eyebrow="Account security"
        title="Change password"
        description={
          user.mustChangePassword
            ? "Replace your initial password before accessing meetings."
            : "Verify your current password and choose a new one."
        }
      />
      <p className="mt-4">
        Use 12–128 characters. All sessions will end after a successful change;
        sign in again with your new password.
      </p>
      <CredentialForm change />
    </>
  );
}
