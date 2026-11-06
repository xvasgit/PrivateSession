import "server-only";
import {
  encryptReview,
  decryptReview,
  type EncryptedReview,
} from "./review-encryption";
import type { MeetingReview } from "../meetings/review";
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

export async function sealReview(review: MeetingReview, meetingId: number) {
  return encryptReview(review, await labKey(), meetingId);
}
export async function openReview(record: EncryptedReview, meetingId: number) {
  return decryptReview(record, await labKey(), meetingId);
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
