import { describe, expect, it } from "vitest";
import {
  validateSessionDraft,
  type SessionDraftInput,
} from "../../lib/sessions/types";

const valid: SessionDraftInput = {
  title: "Synthetic lecture",
  purpose: "Practice the consent workflow.",
  consent: true,
  microphone: true,
  systemAudio: false,
  screen: false,
};

describe("session setup validation", () => {
  it("V-01 accepts a valid consented draft", () => {
    expect(validateSessionDraft(valid)).toEqual({});
  });
  it("V-02 rejects empty and oversized titles", () => {
    expect(validateSessionDraft({ ...valid, title: "  " })).toHaveProperty(
      "title",
    );
    expect(
      validateSessionDraft({ ...valid, title: "a".repeat(81) }),
    ).toHaveProperty("title");
  });
  it("V-03 rejects missing consent and all disabled sources", () => {
    expect(
      validateSessionDraft({ ...valid, consent: false, microphone: false }),
    ).toMatchObject({
      consent: expect.any(String),
      capture: expect.any(String),
    });
  });
  it("V-04 checks purpose length boundaries", () => {
    expect(
      validateSessionDraft({ ...valid, purpose: "a".repeat(9) }),
    ).toHaveProperty("purpose");
    expect(validateSessionDraft({ ...valid, purpose: "a".repeat(10) })).toEqual(
      {},
    );
    expect(
      validateSessionDraft({ ...valid, purpose: "a".repeat(501) }),
    ).toHaveProperty("purpose");
  });
});
