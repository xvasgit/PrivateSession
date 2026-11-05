import "server-only";
import {
  decryptTranscript,
  encryptTranscript,
  importTranscriptKey,
  type EncryptedSegment,
  type SegmentIdentity,
} from "./transcript-encryption";

let keyPromise: Promise<CryptoKey> | undefined;
function labKey() {
  // Read only on first use. Configuration changes require a process restart.
  return (keyPromise ??= importTranscriptKey(process.env.DATA_ENCRYPTION_KEY));
}

export async function sealTranscript(text: string, identity: SegmentIdentity) {
  return encryptTranscript(text, await labKey(), identity);
}

export async function openTranscript(
  record: EncryptedSegment,
  identity: SegmentIdentity,
) {
  return decryptTranscript(record, await labKey(), identity);
}
