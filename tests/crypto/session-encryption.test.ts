import { describe, expect, it } from "vitest";
import {
  createSessionKey,
  decryptSession,
  encryptSession,
} from "../../lib/crypto/session-encryption";

function flipByte(hex: string, offset = 0): string {
  const position = offset * 2;
  return (
    hex.slice(0, position) +
    (parseInt(hex.slice(position, position + 2), 16) ^ 1)
      .toString(16)
      .padStart(2, "0") +
    hex.slice(position + 2)
  );
}

describe("local meeting-session encryption", () => {
  it("C-01 round-trips synthetic meeting data", async () => {
    const key = await createSessionKey();
    const text = JSON.stringify({
      title: "Synthetic lecture",
      notes: "Review consent",
    });
    const payload = await encryptSession(text, key, "session-1");
    expect(await decryptSession(payload, key, "session-1")).toBe(text);
    expect(payload.nonceHex).toHaveLength(24);
  });

  it("C-02 preserves Unicode text and empty payloads", async () => {
    const key = await createSessionKey();
    for (const text of ["", "Catatan kuliah — 安全 🔐"]) {
      expect(
        await decryptSession(
          await encryptSession(text, key, "unicode"),
          key,
          "unicode",
        ),
      ).toBe(text);
    }
  });

  it("C-03 produces fresh nonces for repeated content", async () => {
    const key = await createSessionKey();
    const first = await encryptSession("same notes", key, "session-1");
    const second = await encryptSession("same notes", key, "session-1");
    expect(first.nonceHex).not.toBe(second.nonceHex);
    expect(first.ciphertextHex).not.toBe(second.ciphertextHex);
  });

  it("C-04 rejects a changed ciphertext byte (critical)", async () => {
    const key = await createSessionKey();
    const payload = await encryptSession(
      "synthetic transcript",
      key,
      "session-1",
    );
    await expect(
      decryptSession(
        { ...payload, ciphertextHex: flipByte(payload.ciphertextHex) },
        key,
        "session-1",
      ),
    ).rejects.toThrow();
  });

  it("C-05 rejects a changed authentication tag (critical)", async () => {
    const key = await createSessionKey();
    const payload = await encryptSession("synthetic notes", key, "session-1");
    await expect(
      decryptSession(
        {
          ...payload,
          ciphertextHex: flipByte(
            payload.ciphertextHex,
            payload.ciphertextHex.length / 2 - 1,
          ),
        },
        key,
        "session-1",
      ),
    ).rejects.toThrow();
  });

  it("C-06 rejects a different key (critical)", async () => {
    const key = await createSessionKey();
    const otherKey = await createSessionKey();
    const payload = await encryptSession("synthetic notes", key, "session-1");
    await expect(
      decryptSession(payload, otherKey, "session-1"),
    ).rejects.toThrow();
  });

  it("C-07 rejects moving an envelope to a different session (critical)", async () => {
    const key = await createSessionKey();
    const payload = await encryptSession("synthetic notes", key, "session-1");
    await expect(decryptSession(payload, key, "session-2")).rejects.toThrow();
  });

  it("C-08 rejects a changed nonce", async () => {
    const key = await createSessionKey();
    const payload = await encryptSession("synthetic notes", key, "session-1");
    await expect(
      decryptSession(
        { ...payload, nonceHex: flipByte(payload.nonceHex) },
        key,
        "session-1",
      ),
    ).rejects.toThrow();
  });

  it("C-09 rejects malformed and truncated envelopes", async () => {
    const key = await createSessionKey();
    const payload = await encryptSession("synthetic notes", key, "session-1");
    await expect(
      decryptSession({ ...payload, nonceHex: "not-hex" }, key, "session-1"),
    ).rejects.toThrow("encoding");
    await expect(
      decryptSession({ ...payload, nonceHex: "00" }, key, "session-1"),
    ).rejects.toThrow("lengths");
    await expect(
      decryptSession({ ...payload, ciphertextHex: "00" }, key, "session-1"),
    ).rejects.toThrow("lengths");
    await expect(
      decryptSession(
        { ...payload, version: 2 } as unknown as typeof payload,
        key,
        "session-1",
      ),
    ).rejects.toThrow("Unsupported");
  });

  it("C-10 keeps AES-256 keys non-exportable", async () => {
    const key = await createSessionKey();
    expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
  });

  it("C-11 rejects missing session context", async () => {
    await expect(
      encryptSession("notes", await createSessionKey(), ""),
    ).rejects.toThrow("session ID");
  });
});
