import { describe, expect, it } from "vitest";
import {
  createSessionKey,
  encryptSession,
} from "../../lib/crypto/session-encryption";
import {
  encryptReview,
  decryptReview,
} from "../../lib/crypto/review-encryption";
import { reviewSchema } from "../../lib/meetings/review";

const review = {
  summary: "Synthetic summary — 安全\nSecond line",
  insights: "Keep context",
  followUps: "Check next week",
};
describe("encrypted manual review", () => {
  it("round-trips Unicode, uses fresh IVs, and exposes no plaintext", async () => {
    const key = await createSessionKey();
    const first = await encryptReview(review, key, 1);
    const second = await encryptReview(review, key, 1);
    expect(first.reviewIv).toHaveLength(12);
    expect(first.reviewIv).not.toEqual(second.reviewIv);
    expect(
      Buffer.from(first.reviewCiphertext).includes(Buffer.from(review.summary)),
    ).toBe(false);
    expect(await decryptReview(first, key, 1)).toEqual(review);
  });
  it("rejects wrong keys, meeting identities, changed ciphertext, tags and IVs", async () => {
    const key = await createSessionKey();
    const row = await encryptReview(review, key, 1);
    await expect(
      decryptReview(row, await createSessionKey(), 1),
    ).rejects.toThrow("authenticated");
    await expect(decryptReview(row, key, 2)).rejects.toThrow("authenticated");
    for (const field of ["reviewCiphertext", "reviewIv"] as const) {
      for (const index of [0, row[field].length - 1]) {
        const damaged = { ...row, [field]: Uint8Array.from(row[field]) };
        damaged[field][index] ^= 1;
        await expect(decryptReview(damaged, key, 1)).rejects.toThrow(
          "authenticated",
        );
      }
    }
  });
  it("rejects authenticated but malformed review payloads", async () => {
    const key = await createSessionKey();
    for (const payload of [
      "invalid JSON",
      JSON.stringify({ ...review, version: 2 }),
      JSON.stringify({ version: 1, summary: "only" }),
    ]) {
      const row = await encryptSession(payload, key, "meeting-review:v1:1");
      await expect(
        decryptReview(
          {
            reviewIv: Uint8Array.from(Buffer.from(row.nonceHex, "hex")),
            reviewCiphertext: Uint8Array.from(
              Buffer.from(row.ciphertextHex, "hex"),
            ),
          },
          key,
          1,
        ),
      ).rejects.toThrow("authenticated");
    }
  });
  it("validates all field limits, permits clearing and preserves nonblank spacing", () => {
    expect(
      reviewSchema.parse({ summary: " \n", insights: "", followUps: "" })
        .summary,
    ).toBe("");
    expect(reviewSchema.parse({ ...review, summary: " x \n" }).summary).toBe(
      " x \n",
    );
    for (const field of ["summary", "insights", "followUps"] as const) {
      expect(
        reviewSchema.safeParse({ ...review, [field]: "x".repeat(10000) })
          .success,
      ).toBe(true);
      for (const bad of [undefined, null, 42, "x".repeat(10001)])
        expect(
          reviewSchema.safeParse({ ...review, [field]: bad }).success,
        ).toBe(false);
    }
  });
});
