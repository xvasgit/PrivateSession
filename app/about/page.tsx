import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "About | PrivateSession" };

export default function AboutPage() {
  return (
    <>
      <PageHeading
        eyebrow="PrivateSession"
        title="About PrivateSession"
        description="PrivateSession is a privacy-first meeting assistant for students and professionals. The intended product helps users retain live conversation context, review past recordings, and initialize context-specific AI workspaces."
      />
      <Card>
        <h2 className="text-lg font-semibold">Your choices come first</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Local processing, explicit consent, and control over what is captured
          and retained guide the product. These capabilities are still being
          built: this web preview requests no device access and sends no meeting
          contents anywhere. Explicit upload validation sends only the filename
          and size to this app’s server. The separate practicum sends synthetic
          credentials and request fields, uses a demo session cookie, and stores
          metadata temporarily in server memory. Sample outputs are synthetic,
          not results from your device or files.
        </p>
      </Card>
    </>
  );
}
