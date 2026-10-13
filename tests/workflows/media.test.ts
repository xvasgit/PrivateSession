import { describe, expect, it } from "vitest";
import {
  describeMediaFile,
  formatFileSize,
  mediaExtensions,
  validateMediaFile,
} from "../../lib/workflows/media";
describe("local media metadata validation", () => {
  it.each(mediaExtensions)("accepts %s regardless of case", (extension) => {
    expect(
      validateMediaFile({ name: `sample${extension}`, size: 8 }),
    ).toBeUndefined();
    expect(
      validateMediaFile({ name: `sample${extension.toUpperCase()}`, size: 8 }),
    ).toBeUndefined();
  });
  it.each(["sample.txt", "mp3", "sample.mp3.exe", "sample.mp3."])(
    "rejects %s",
    (name) => {
      expect(validateMediaFile({ name, size: 8 })).toMatch(/Choose an/);
    },
  );
  it("rejects zero bytes", () => {
    expect(validateMediaFile({ name: "empty.wav", size: 0 })).toMatch(/empty/);
  });
  it("classifies audio and video using metadata only", () => {
    expect(describeMediaFile({ name: "sample.MP3", size: 8 })).toEqual({
      name: "sample.MP3",
      size: 8,
      category: "Audio",
    });
    expect(describeMediaFile({ name: "sample.MOV", size: 16 }).category).toBe(
      "Video",
    );
  });
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatFileSize(8)).toBe("8 B");
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
  });
});
