/** Local-only AEAD. Keys are non-exportable and supplied by the vault/session owner. */
export interface EncryptedSession {
  version: 1;
  algorithm: "AES-256-GCM";
  nonceHex: string;
  ciphertextHex: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function fromHex(value: string): Uint8Array<ArrayBuffer> {
  if (typeof value !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(value)) {
    throw new Error("Invalid encrypted session encoding");
  }
  return Uint8Array.from(value.match(/.{2}/g)!, (pair) => parseInt(pair, 16));
}

function contextBytes(sessionId: string): Uint8Array<ArrayBuffer> {
  if (!sessionId || sessionId.length > 128) {
    throw new Error("A valid session ID is required");
  }
  return new TextEncoder().encode(`meeting-session:v1:${sessionId}`);
}

export async function createSessionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSession(
  plaintext: string,
  key: CryptoKey,
  sessionId: string,
): Promise<EncryptedSession> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      additionalData: contextBytes(sessionId),
      tagLength: 128,
    },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    version: 1,
    algorithm: "AES-256-GCM",
    nonceHex: toHex(nonce),
    // Web Crypto appends the 16-byte authentication tag to the ciphertext.
    ciphertextHex: toHex(new Uint8Array(encrypted)),
  };
}

export async function decryptSession(
  payload: EncryptedSession,
  key: CryptoKey,
  sessionId: string,
): Promise<string> {
  if (payload.version !== 1 || payload.algorithm !== "AES-256-GCM") {
    throw new Error("Unsupported encrypted session format");
  }
  const nonce = fromHex(payload.nonceHex);
  const ciphertext = fromHex(payload.ciphertextHex);
  if (nonce.length !== 12 || ciphertext.length < 16) {
    throw new Error("Invalid encrypted session lengths");
  }
  const aad = contextBytes(sessionId);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128 },
    key,
    ciphertext,
  );
  // No plaintext is returned unless GCM authentication succeeds.
  return new TextDecoder("utf-8", { fatal: true }).decode(decrypted);
}
