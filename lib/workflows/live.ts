export type CaptureMode = "online" | "recording";
export interface CaptureSources {
  microphone: boolean;
  systemAudio: boolean;
  screen: boolean;
}
export interface LiveSetup extends CaptureSources {
  mode: CaptureMode;
  title: string;
  context: string;
  consent: boolean;
}
export type LiveErrors = Partial<
  Record<"title" | "context" | "capture" | "consent", string>
>;

export function defaultSources(mode: CaptureMode): CaptureSources {
  return {
    microphone: true,
    systemAudio: mode === "online",
    screen: mode === "online",
  };
}

export function validateLiveSetup(input: LiveSetup): LiveErrors {
  const errors: LiveErrors = {};
  if (input.title.trim().length < 3 || input.title.trim().length > 80)
    errors.title = "Enter a meeting title between 3 and 80 characters.";
  if (input.context.length > 500)
    errors.context = "Keep optional context within 500 characters.";
  if (input.mode === "online" && !input.microphone && !input.systemAudio)
    errors.capture =
      "Select at least one audio source; snapshots alone cannot provide speech.";
  if (input.mode === "recording" && (!input.microphone || input.systemAudio))
    errors.capture =
      "Live recording requires microphone and does not support system audio.";
  if (!input.consent)
    errors.consent = "Confirm participant consent before preparing setup.";
  return errors;
}

export const sourceLabels: Record<keyof CaptureSources, string> = {
  microphone: "Microphone",
  systemAudio: "System audio",
  screen: "Screen snapshots",
};
