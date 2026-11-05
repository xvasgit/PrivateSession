import { FeatureCard } from "@/components/feature-card";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export default function OverviewPage() {
  return (
    <>
      <PageHeading
        eyebrow="PrivateSession"
        title="Be present. Keep the context."
        description="A privacy-first assistant for conversations, past recordings, and the context behind your work. Explore interface demos and optional recording metadata validation; your media stays on-device."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <FeatureCard
          title="Live Transcription"
          status="In progress"
          href="/live/"
          description="Keep real-time context relevant with your choice of microphone, system audio, and screen snapshots."
          steps={[
            "Choose online meeting or live recording and your sources.",
            "Confirm consent before capture.",
            "Follow speech and screen context together in a live transcript.",
          ]}
        />
        <FeatureCard
          title="Upload & Review"
          status="In progress"
          href="/upload/"
          description="Revisit past meetings with summaries, insights, follow-ups, and potential missed details."
          steps={[
            "Select an audio or video recording.",
            "Turn the conversation into a structured review.",
            "Check follow-ups and unresolved details before acting.",
          ]}
        />
        <FeatureCard
          title="Contextual Workspaces"
          status="Upcoming"
          description="Give a field-specific AI assistant the context it needs to understand your workflow and manage related work in one place."
          steps={[
            "Initialize a workspace with prompts, documents, and images.",
            "Connect relevant tools through MCP connectors.",
            "Keep assistance grounded in that workspace's context.",
          ]}
        />
      </div>
      <Card className="mt-8 bg-teal-50/40">
        <h2 className="text-lg font-semibold">Your choices come first</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Local processing, explicit consent, and control over what is captured
          and retained guide the product. These capabilities are still being
          built: this web preview requests no device access and sends no meeting
          content anywhere. Sample outputs are synthetic, not results from your
          device or files.
        </p>
      </Card>
    </>
  );
}
