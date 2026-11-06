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
          and retained guide the product. The web app stores explicitly
          submitted meeting metadata, transcripts, and manual reviews in
          PostgreSQL. Transcript and review text are encrypted at rest; this
          server can decrypt them. Titles, codes, sequence numbers, and
          timestamps remain plaintext. Recording validation sends only filename
          and size, never media contents. Accounts can access only their own
          meetings. Administrators manage account access without receiving
          access to private meeting content. Use synthetic information in this
          lab. Sessions survive restarts and expire after eight hours; signing
          out or changing a password revokes access. Live capture, processing,
          and contextual workspaces are upcoming.
        </p>
      </Card>
    </>
  );
}
