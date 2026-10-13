import { describe, expect, it } from "vitest";
import {
  defaultSources,
  validateLiveSetup,
  type LiveSetup,
} from "../../lib/workflows/live";

const valid: LiveSetup = {
  mode: "online",
  title: "Synthetic review",
  context: "",
  consent: true,
  ...defaultSources("online"),
};
describe("live setup", () => {
  it("defaults online to all sources and recording to microphone only", () => {
    expect(defaultSources("online")).toEqual({
      microphone: true,
      systemAudio: true,
      screen: true,
    });
    expect(defaultSources("recording")).toEqual({
      microphone: true,
      systemAudio: false,
      screen: false,
    });
  });
  it("accepts optional empty context and title boundaries", () => {
    for (const length of [3, 80])
      expect(
        validateLiveSetup({ ...valid, title: "a".repeat(length) }),
      ).toEqual({});
  });
  it("rejects blank, short, and oversized titles after trimming", () => {
    for (const title of ["   ", " ab ", "a".repeat(81)])
      expect(validateLiveSetup({ ...valid, title })).toHaveProperty("title");
  });
  it("checks the optional context length boundary", () => {
    expect(validateLiveSetup({ ...valid, context: "a".repeat(500) })).toEqual(
      {},
    );
    expect(
      validateLiveSetup({ ...valid, context: "a".repeat(501) }),
    ).toHaveProperty("context");
  });
  it("requires consent", () => {
    expect(validateLiveSetup({ ...valid, consent: false })).toHaveProperty(
      "consent",
    );
  });
  it("requires audio, not just screen snapshots, online", () => {
    expect(
      validateLiveSetup({ ...valid, microphone: false, systemAudio: false }),
    ).toHaveProperty("capture");
    expect(validateLiveSetup({ ...valid, microphone: false })).toEqual({});
    expect(
      validateLiveSetup({ ...valid, systemAudio: false, screen: false }),
    ).toEqual({});
  });
  it("enforces recording source restrictions and allows optional screen context", () => {
    const recording = {
      ...valid,
      mode: "recording" as const,
      ...defaultSources("recording"),
    };
    expect(validateLiveSetup(recording)).toEqual({});
    expect(validateLiveSetup({ ...recording, screen: true })).toEqual({});
    expect(
      validateLiveSetup({ ...recording, microphone: false }),
    ).toHaveProperty("capture");
    expect(
      validateLiveSetup({ ...recording, systemAudio: true }),
    ).toHaveProperty("capture");
  });
});
