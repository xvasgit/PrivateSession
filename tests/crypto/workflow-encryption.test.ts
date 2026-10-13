import { afterEach, describe, expect, it, vi } from "vitest";
import * as cryptoComponent from "../../lib/crypto/session-encryption";
import {
  CryptoUnavailableError,
  encryptAndVerifyArtifact,
} from "../../lib/crypto/workflow-encryption";
import { defaultSources, type LiveSetup } from "../../lib/workflows/live";
import { sampleAnalysis } from "../../lib/workflows/samples";

const draft: LiveSetup = {
  title: "Synthetic review — 安全",
  context: "Discuss the prototype 🔐",
  mode: "online",
  consent: true,
  ...defaultSources("online"),
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("workflow encryption integration", () => {
  it("W-01 verifies the exact prepared draft and returns no plaintext or key", async () => {
    const encrypt = vi.spyOn(cryptoComponent, "encryptSession");
    const decrypt = vi.spyOn(cryptoComponent, "decryptSession");
    const result = await encryptAndVerifyArtifact({
      kind: "live-draft",
      data: draft,
    });
    const [plaintext, key, context] = encrypt.mock.calls[0];
    expect(JSON.parse(plaintext)).toEqual({ kind: "live-draft", data: draft });
    expect(await decrypt.mock.results[0].value).toBe(plaintext);
    expect(decrypt).toHaveBeenCalledWith(result.envelope, key, context);
    expect(context).toBe(result.artifactId);
    expect(context).toMatch(/^live-draft:/);
    expect(key.extractable).toBe(false);
    expect(Object.keys(result).sort()).toEqual(["artifactId", "envelope"]);
    expect(JSON.stringify(result)).not.toContain(draft.title);
  });

  it("W-02 seals only the fixed synthetic review with a distinct context kind", async () => {
    const encrypt = vi.spyOn(cryptoComponent, "encryptSession");
    const decrypt = vi.spyOn(cryptoComponent, "decryptSession");
    const result = await encryptAndVerifyArtifact({ kind: "sample-review" });
    const [plaintext] = encrypt.mock.calls[0];
    expect(JSON.parse(plaintext)).toEqual({
      kind: "sample-review",
      data: sampleAnalysis,
    });
    expect(await decrypt.mock.results[0].value).toBe(plaintext);
    expect(result.artifactId).toMatch(/^sample-review:/);
    expect(Object.keys(result).sort()).toEqual(["artifactId", "envelope"]);
  });

  it("W-03 uses fresh keys, artifact contexts and nonces for repeated operations", async () => {
    const encrypt = vi.spyOn(cryptoComponent, "encryptSession");
    const first = await encryptAndVerifyArtifact({ kind: "sample-review" });
    const second = await encryptAndVerifyArtifact({ kind: "sample-review" });
    expect(first.artifactId).not.toBe(second.artifactId);
    expect(first.envelope.nonceHex).not.toBe(second.envelope.nonceHex);
    expect(first.envelope.ciphertextHex).not.toBe(
      second.envelope.ciphertextHex,
    );
    expect(encrypt.mock.calls[0][1]).not.toBe(encrypt.mock.calls[1][1]);
  });

  it("W-04 rejects invalid drafts before creating a key", async () => {
    const generate = vi.spyOn(cryptoComponent, "createSessionKey");
    await expect(
      encryptAndVerifyArtifact({
        kind: "live-draft",
        data: { ...draft, consent: false },
      }),
    ).rejects.toThrow("valid live draft");
    expect(generate).not.toHaveBeenCalled();
  });

  it.each(["createSessionKey", "encryptSession", "decryptSession"] as const)(
    "W-05 propagates %s failure instead of returning a verified envelope",
    async (method) => {
      const failure = new Error("Injected crypto failure");
      vi.spyOn(cryptoComponent, method).mockRejectedValueOnce(failure);
      await expect(
        encryptAndVerifyArtifact({ kind: "sample-review" }),
      ).rejects.toBe(failure);
    },
  );

  it("W-06 rejects decoded text that does not match the input", async () => {
    vi.spyOn(cryptoComponent, "decryptSession").mockResolvedValueOnce(
      "different text",
    );
    await expect(
      encryptAndVerifyArtifact({ kind: "sample-review" }),
    ).rejects.toThrow("did not match");
  });

  it("W-07 reports unavailable Web Crypto", async () => {
    vi.stubGlobal("crypto", undefined);
    await expect(
      encryptAndVerifyArtifact({ kind: "sample-review" }),
    ).rejects.toBeInstanceOf(CryptoUnavailableError);
  });

  it("W-08 snapshots the draft before asynchronous work", async () => {
    const encrypt = vi.spyOn(cryptoComponent, "encryptSession");
    const input = { ...draft };
    const result = encryptAndVerifyArtifact({
      kind: "live-draft",
      data: input,
    });
    input.title = "Later edit";
    await result;
    expect(JSON.parse(encrypt.mock.calls[0][0]).data).toEqual(draft);
  });
});
