import { decryptSession, encryptSession } from "./session-encryption";

export type SegmentIdentity = { sessionId: number; sequence: number };
export type EncryptedSegment = {
  contentCiphertext: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
};

/** Explicit input keeps this reusable by the standalone seed without reading env. */
export async function importTranscriptKey(value: string | undefined) {
  if (
    !value ||
    !/^[A-Za-z0-9+/]{43}=$/.test(value) ||
    Buffer.from(value, "base64").toString("base64") !== value
  )
    throw new Error("Configure a canonical Base64-encoded 32-byte lab key.");
  const bytes = Uint8Array.from(Buffer.from(value, "base64"));
  try {
    return await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]);
  } finally {
    bytes.fill(0);
  }
}

function context({ sessionId, sequence }: SegmentIdentity) {
  if (
    !Number.isInteger(sessionId) ||
    sessionId < 1 ||
    sessionId > 2147483647 ||
    !Number.isInteger(sequence) ||
    sequence < 1 ||
    sequence > 2147483647
  )
    throw new Error(
      "Segment identity must contain positive PostgreSQL integers.",
    );
  return `transcript-segment:v1:${sessionId}:${sequence}`;
}

export async function encryptTranscript(
  plaintext: string,
  key: CryptoKey,
  identity: SegmentIdentity,
): Promise<EncryptedSegment> {
  const envelope = await encryptSession(plaintext, key, context(identity));
  return {
    contentCiphertext: Uint8Array.from(
      Buffer.from(envelope.ciphertextHex, "hex"),
    ),
    iv: Uint8Array.from(Buffer.from(envelope.nonceHex, "hex")),
  };
}

export async function decryptTranscript(
  record: EncryptedSegment,
  key: CryptoKey,
  identity: SegmentIdentity,
): Promise<string> {
  const aad = context(identity);
  try {
    return await decryptSession(
      {
        version: 1,
        algorithm: "AES-256-GCM",
        nonceHex: Buffer.from(record.iv).toString("hex"),
        ciphertextHex: Buffer.from(record.contentCiphertext).toString("hex"),
      },
      key,
      aad,
    );
  } catch {
    throw new Error("The transcript could not be authenticated or decrypted.");
  }
}
