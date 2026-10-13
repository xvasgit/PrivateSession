import { LiveSetupForm } from "@/components/live-setup-form";
import { TranscriptPreview } from "@/components/transcript-preview";
import { PageHeading } from "@/components/ui/page-heading";
export default function LivePage() {
  return (
    <>
      <PageHeading
        eyebrow="In progress"
        title="Live Transcription"
        description="Choose your sources for an online meeting or a live recording. Capture and real-time AI are being built; explore setup and a synthetic transcript without accessing your devices."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <LiveSetupForm />
        <TranscriptPreview />
      </div>
    </>
  );
}
