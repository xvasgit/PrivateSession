import { describe, expect, it } from "vitest";
import { validateRecordingMetadata } from "../../app/upload/actions";
import { mediaMetadataSchema } from "../../lib/workflows/media";

describe("server metadata validation independently of the picker", () => {
  it.each([
    ["no selection", null, null],
    ["empty filename", "", "8"],
    ["unsupported extension", "notes.txt", "8"],
    ["disguised extension", "meeting.mp3.exe", "8"],
    ["missing size", "meeting.wav", null],
    ["blank size", "meeting.wav", ""],
    ["whitespace size", "meeting.wav", " "],
    ["zero size", "meeting.wav", "0"],
    ["negative size", "meeting.wav", "-1"],
    ["fractional size", "meeting.wav", "1.5"],
    ["malformed size", "meeting.wav", "8bytes"],
    ["infinite size", "meeting.wav", "Infinity"],
    ["unsafe size", "meeting.wav", "9007199254740992"],
    ["hex size", "meeting.wav", "0x10"],
  ])("rejects %s", async (_label, name, size) => {
    const data = new FormData();
    if (name !== null) data.set("name", name);
    if (size !== null) data.set("size", size);
    const result = await validateRecordingMetadata(data);
    expect(result.status).toBe("error");
    expect(result).not.toHaveProperty("metadata");
    if (result.status === "error")
      expect(Object.keys(result.fieldErrors ?? {}).length).toBeGreaterThan(0);
  });

  it("derives category and discards unrelated client fields", async () => {
    const data = new FormData();
    data.set("name", "Synthetic.MOV");
    data.set("size", "16");
    data.set("category", "Audio");
    expect(await validateRecordingMetadata(data)).toEqual({
      status: "success",
      metadata: { name: "Synthetic.MOV", size: 16, category: "Video" },
    });
  });

  it("rejects File values instead of coercing them to strings", async () => {
    for (const field of ["name", "size"]) {
      const data = new FormData();
      data.set("name", "synthetic.mp3");
      data.set("size", "8");
      data.set(field, new File(["synthetic"], "synthetic.mp3"));
      expect((await validateRecordingMetadata(data)).status).toBe("error");
    }
  });

  it("shares strict numeric validation without an arbitrary file size cap", () => {
    for (const size of [
      0,
      -1,
      1.5,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(
        mediaMetadataSchema.safeParse({ name: "sample.mp4", size }).success,
      ).toBe(false);
    }
    expect(
      mediaMetadataSchema.safeParse({
        name: "sample.mp4",
        size: Number.MAX_SAFE_INTEGER,
      }).success,
    ).toBe(true);
  });
});
