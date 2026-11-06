import { encryptSession, decryptSession } from "./session-encryption";
import { positiveId } from "../meetings/schema";
import {
  reviewPayloadSchema,
  reviewSchema,
  type MeetingReview,
} from "../meetings/review";
export type EncryptedReview = {
  reviewCiphertext: Uint8Array<ArrayBuffer>;
  reviewIv: Uint8Array<ArrayBuffer>;
};
function context(meetingId: number) {
  return `meeting-review:v1:${positiveId.parse(meetingId)}`;
}
export async function encryptReview(
  review: MeetingReview,
  key: CryptoKey,
  meetingId: number,
): Promise<EncryptedReview> {
  const payload = { version: 1, ...reviewSchema.parse(review) };
  const encrypted = await encryptSession(
    JSON.stringify(payload),
    key,
    context(meetingId),
  );
  return {
    reviewCiphertext: Uint8Array.from(
      Buffer.from(encrypted.ciphertextHex, "hex"),
    ),
    reviewIv: Uint8Array.from(Buffer.from(encrypted.nonceHex, "hex")),
  };
}
export async function decryptReview(
  record: EncryptedReview,
  key: CryptoKey,
  meetingId: number,
): Promise<MeetingReview> {
  try {
    const text = await decryptSession(
      {
        version: 1,
        algorithm: "AES-256-GCM",
        ciphertextHex: Buffer.from(record.reviewCiphertext).toString("hex"),
        nonceHex: Buffer.from(record.reviewIv).toString("hex"),
      },
      key,
      context(meetingId),
    );
    const parsed = reviewPayloadSchema.parse(JSON.parse(text));
    return {
      summary: parsed.summary,
      insights: parsed.insights,
      followUps: parsed.followUps,
    };
  } catch {
    throw new Error("The review could not be authenticated or decrypted.");
  }
}
