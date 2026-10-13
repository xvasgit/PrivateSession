import { validateLiveSetup, type LiveSetup } from "../workflows/live";
import { sampleAnalysis } from "../workflows/samples";
import {
  createSessionKey,
  decryptSession,
  encryptSession,
  type EncryptedSession,
} from "./session-encryption";

export type WorkflowArtifact =
  { kind: "live-draft"; data: LiveSetup } | { kind: "sample-review" };

export interface VerifiedArtifact {
  artifactId: string;
  envelope: EncryptedSession;
}

export class CryptoUnavailableError extends Error {
  constructor() {
    super(
      "Web Crypto is unavailable. Use a supported browser on localhost or HTTPS.",
    );
    this.name = "CryptoUnavailableError";
  }
}

function serializeArtifact(artifact: WorkflowArtifact): string {
  if (artifact.kind === "sample-review") {
    // Deliberately independent of the file picker: only fixed synthetic text.
    return JSON.stringify({ kind: artifact.kind, data: sampleAnalysis });
  }
  if (Object.keys(validateLiveSetup(artifact.data)).length) {
    throw new Error("Prepare a valid live draft before encryption.");
  }
  const { title, context, mode, microphone, systemAudio, screen, consent } =
    artifact.data;
  return JSON.stringify({
    kind: artifact.kind,
    data: {
      title: title.trim(),
      context,
      mode,
      microphone,
      systemAudio,
      screen,
      consent,
    },
  });
}

/** Demonstrates a local round trip; never returns or persists the temporary key. */
export async function encryptAndVerifyArtifact(
  artifact: WorkflowArtifact,
): Promise<VerifiedArtifact> {
  if (
    (typeof window !== "undefined" && !window.isSecureContext) ||
    !globalThis.crypto?.subtle ||
    !globalThis.crypto.randomUUID
  ) {
    throw new CryptoUnavailableError();
  }
  // Snapshot before awaiting so later edits cannot change the data being verified.
  const plaintext = serializeArtifact(artifact);
  const artifactId = `${artifact.kind}:${crypto.randomUUID()}`;
  const key = await createSessionKey();
  const envelope = await encryptSession(plaintext, key, artifactId);
  const restored = await decryptSession(envelope, key, artifactId);
  if (restored !== plaintext) {
    throw new Error("Decrypted content did not match the original artifact.");
  }
  // Key/plaintext references stay local to this call; JS cannot guarantee erasure.
  return { artifactId, envelope };
}
