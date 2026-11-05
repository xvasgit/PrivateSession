import { describe, expect, it } from "vitest";
import {
  decryptTranscript,
  encryptTranscript,
  importTranscriptKey,
} from "../../lib/crypto/transcript-encryption";

const secret = () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
const identity = { sessionId: 1, sequence: 1 };

describe("persistent transcript encryption adapter", () => {
  it("reopens binary ciphertext after importing the same raw key again", async () => {
    const value = secret();
    const key = await importTranscriptKey(value);
    const text = "Synthetic transcript — Catatan 安全 🔐";
    const row = await encryptTranscript(text, key, identity);
    expect(row.iv).toHaveLength(12);
    expect(row.contentCiphertext.length).toBe(
      new TextEncoder().encode(text).length + 16,
    );
    expect(Buffer.from(row.contentCiphertext).includes(Buffer.from(text))).toBe(
      false,
    );
    expect(
      await decryptTranscript(row, await importTranscriptKey(value), identity),
    ).toBe(text);
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
  });

  it.each([
    undefined,
    "",
    "password",
    Buffer.alloc(16).toString("base64"),
    Buffer.alloc(33).toString("base64"),
    Buffer.alloc(32).toString("base64") + " ",
  ])("rejects missing or malformed key input", async (value) => {
    await expect(importTranscriptKey(value)).rejects.toThrow("32-byte lab key");
  });

  it("uses fresh IVs on edits and authenticates the session and sequence", async () => {
    const key = await importTranscriptKey(secret());
    const first = await encryptTranscript(
      "Synthetic first draft",
      key,
      identity,
    );
    const second = await encryptTranscript(
      "Synthetic edited draft",
      key,
      identity,
    );
    expect(first.iv).not.toEqual(second.iv);
    expect(await decryptTranscript(second, key, identity)).toBe(
      "Synthetic edited draft",
    );
    for (const moved of [
      { sessionId: 2, sequence: 1 },
      { sessionId: 1, sequence: 2 },
    ])
      await expect(decryptTranscript(first, key, moved)).rejects.toThrow(
        "authenticated or decrypted",
      );
  });

  it("rejects wrong keys, tampering and short binary fields with a generic error", async () => {
    const key = await importTranscriptKey(secret());
    const row = await encryptTranscript(
      "Synthetic private text",
      key,
      identity,
    );
    await expect(
      decryptTranscript(row, await importTranscriptKey(secret()), identity),
    ).rejects.toThrow("authenticated or decrypted");
    const damaged = {
      ...row,
      contentCiphertext: Uint8Array.from(row.contentCiphertext),
    };
    damaged.contentCiphertext[0] ^= 1;
    const tag = {
      ...row,
      contentCiphertext: Uint8Array.from(row.contentCiphertext),
    };
    tag.contentCiphertext[tag.contentCiphertext.length - 1] ^= 1;
    const iv = { ...row, iv: Uint8Array.from(row.iv) };
    iv.iv[0] ^= 1;
    for (const broken of [
      damaged,
      tag,
      iv,
      { ...row, iv: new Uint8Array(1) },
      { ...row, contentCiphertext: new Uint8Array(1) },
    ])
      await expect(decryptTranscript(broken, key, identity)).rejects.toThrow(
        "authenticated or decrypted",
      );
  });

  it.each([0, -1, 1.5, NaN, 2147483648])(
    "rejects invalid record identities",
    async (value) => {
      const key = await importTranscriptKey(secret());
      await expect(
        encryptTranscript("text", key, { ...identity, sessionId: value }),
      ).rejects.toThrow("positive PostgreSQL integers");
      await expect(
        encryptTranscript("text", key, { ...identity, sequence: value }),
      ).rejects.toThrow("positive PostgreSQL integers");
    },
  );
});
