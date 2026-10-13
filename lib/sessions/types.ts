// Legacy encrypted-draft validation, retained for regression tests; not wired to the PemWeb UI.
export interface SessionDraftInput {
  title: string;
  purpose: string;
  consent: boolean;
  microphone: boolean;
  systemAudio: boolean;
  screen: boolean;
}

export type DraftErrors = Partial<
  Record<"title" | "purpose" | "consent" | "capture", string>
>;

export function validateSessionDraft(input: SessionDraftInput): DraftErrors {
  const errors: DraftErrors = {};
  if (input.title.trim().length < 3 || input.title.trim().length > 80) {
    errors.title = "Enter a meeting title between 3 and 80 characters.";
  }
  if (input.purpose.trim().length < 10 || input.purpose.trim().length > 500) {
    errors.purpose = "Describe the purpose in 10 to 500 characters.";
  }
  if (!input.consent) {
    errors.consent = "Confirm participant consent before preparing a session.";
  }
  if (!input.microphone && !input.systemAudio && !input.screen) {
    errors.capture = "Select at least one capture source.";
  }
  return errors;
}
