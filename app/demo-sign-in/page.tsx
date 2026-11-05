import { DemoSignInForm } from "@/components/practicum/sign-in-form";
import { PageHeading } from "@/components/ui/page-heading";

export default function DemoSignInPage() {
  return (
    <>
      <PageHeading
        eyebrow="Module 5 practicum"
        title="Demo sign-in"
        description="Use only the synthetic lab account configured by the operator. This is not production authentication or registration. The credentials are sent to this app’s server; a temporary HttpOnly session cookie lasts up to eight hours."
      />
      <p className="mt-4 text-sm text-slate-600">
        Demo requests and sessions live only in this server process. Use
        localhost for the lab, or HTTPS for any remote access. Never use
        personal credentials or meeting information.
      </p>
      <DemoSignInForm />
    </>
  );
}
