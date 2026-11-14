import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  commands,
  contentSchema,
  meetingSchema,
  positiveId,
  segmentSchema,
} from "../../lib/meetings/schema";
import { meetingError } from "../../lib/meetings/errors";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  mutate: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  db: {},
}));
vi.mock("server-only", () => ({}));
vi.mock("../../lib/auth/session.server", () => ({
  readActor: mocks.session,
}));
vi.mock("../../lib/prisma", () => ({ getPrisma: () => mocks.db }));
vi.mock("../../lib/meetings/repository", () => ({
  mutateMeeting: mocks.mutate,
}));
vi.mock("../../lib/crypto/transcript-encryption.server", () => ({
  sealTranscript: vi.fn(),
  sealReview: vi.fn(),
  openReview: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { saveMeetingCommand } from "../../app/meetings/actions";

describe("meeting lab validation", () => {
  it.each([
    undefined,
    "",
    " ",
    "0",
    "-1",
    "1.5",
    "1e2",
    "NaN",
    "01",
    "2147483648",
    0,
    -1,
    1.5,
  ])("rejects non-positive/non-canonical database integer %s", (input) =>
    expect(positiveId.safeParse(input).success).toBe(false),
  );
  it("accepts PostgreSQL integer boundaries and preserves text", () => {
    expect(positiveId.parse("2147483647")).toBe(2147483647);
    expect(
      segmentSchema.parse({ sequence: "1", content: " synthetic \n" }),
    ).toEqual({ sequence: 1, content: " synthetic \n" });
    expect(
      meetingSchema.parse({ title: " abc ", sessionCode: " X ", extra: true }),
    ).toEqual({ title: "abc", sessionCode: "X" });
  });
  it("checks both metadata boundaries", () => {
    for (const title of ["ab", " ", "a".repeat(81)])
      expect(meetingSchema.safeParse({ title, sessionCode: "x" }).success).toBe(
        false,
      );
    for (const sessionCode of ["", " ", "x".repeat(65)])
      expect(
        meetingSchema.safeParse({ title: "abc", sessionCode }).success,
      ).toBe(false);
    expect(
      meetingSchema.safeParse({
        title: "a".repeat(80),
        sessionCode: "x".repeat(64),
      }).success,
    ).toBe(true);
  });
  it("checks content boundaries without silently trimming it", () => {
    for (const content of ["", " \n", "x".repeat(10001)])
      expect(contentSchema.safeParse(content).success).toBe(false);
    expect(contentSchema.parse("x".repeat(10000))).toHaveLength(10000);
  });
  it("requires explicit confirmation and strips sequence changes on edits", () => {
    expect(
      commands.safeParse({ operation: "deleteAll", id: "1" }).success,
    ).toBe(false);
    expect(
      commands.safeParse({
        operation: "deleteAll",
        id: "1",
        confirmation: "off",
      }).success,
    ).toBe(false);
    expect(
      commands.safeParse({
        operation: "deleteAll",
        id: "1",
        confirmation: "false",
      }).success,
    ).toBe(false);
    expect(
      commands.parse({
        operation: "deleteAll",
        id: "1",
        confirmation: "true",
      }),
    ).toMatchObject({ operation: "deleteAll", id: 1, confirmation: true });
    expect(
      commands.parse({
        operation: "updateMeeting",
        id: "1",
        sessionCode: "lab",
        title: "Synthetic",
        returnToDetail: "false",
      }),
    ).toMatchObject({ returnToDetail: false });
    expect(
      commands.parse({
        operation: "updateMeeting",
        id: "1",
        sessionCode: "lab",
        title: "Synthetic",
      }),
    ).toMatchObject({ returnToDetail: true });
    expect(
      commands.parse({
        operation: "updateSegment",
        id: "2",
        sessionId: "1",
        content: "test",
        sequence: 99,
      }),
    ).not.toHaveProperty("sequence");
  });
});

describe("protected meeting actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({
      userId: "synthetic",
      sessionId: "session",
    });
    mocks.mutate.mockResolvedValue("/meetings/1/");
  });
  function data(values: Record<string, string | undefined>) {
    const form = new FormData();
    for (const [k, v] of Object.entries(values))
      if (v !== undefined) form.set(k, v);
    return form;
  }
  const valid = {
    operation: "createMeeting",
    sessionCode: "lab",
    title: "Synthetic meeting",
  };
  it("rejects unauthenticated mutation before validation and database access", async () => {
    mocks.session.mockResolvedValue(undefined);
    expect(await saveMeetingCommand({}, data(valid))).toMatchObject({
      message: expect.stringContaining("sign in"),
    });
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it.each([
    { ...valid, title: "ab" },
    { operation: "saveReview", id: "1", summary: "x", insights: "" },
    {
      operation: "saveReview",
      id: "1",
      summary: "x".repeat(10001),
      insights: "",
      followUps: "",
    },
    { operation: "deleteMeeting", id: "-1" },
    {
      operation: "createSegment",
      sessionId: "1",
      sequence: "1.5",
      content: "synthetic",
    },
    { operation: "deleteAll", id: "1" },
  ])("rejects direct invalid action submission %#", async (input) => {
    expect(await saveMeetingCommand({}, data(input))).toMatchObject({
      message: "Check the meeting fields.",
    });
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("mutates before revalidation and lets redirect escape", async () => {
    await expect(saveMeetingCommand({}, data(valid))).rejects.toThrow(
      "REDIRECT:/meetings/1/",
    );
    expect(mocks.mutate).toHaveBeenCalledWith(
      mocks.db,
      { userId: "synthetic", sessionId: "session" },
      expect.any(Function),
      valid,
      { seal: expect.any(Function), open: expect.any(Function) },
    );
    expect(mocks.mutate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.revalidate.mock.invocationCallOrder[0],
    );
    expect(mocks.revalidate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.redirect.mock.invocationCallOrder[0],
    );
  });
  it.each(["P2002", "P2003", "P2025", "unknown"])(
    "returns safe %s without revalidation/redirect",
    async (code) => {
      mocks.mutate.mockRejectedValue({
        code,
        message: "sensitive database input",
      });
      const result = await saveMeetingCommand({}, data(valid));
      expect(result.message).toBeTruthy();
      expect(JSON.stringify(result)).not.toContain("sensitive database input");
      expect(mocks.revalidate).not.toHaveBeenCalled();
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
  it("maps segment uniqueness to sequence", () =>
    expect(
      meetingError({ code: "P2002" }, "createSegment").fieldErrors,
    ).toHaveProperty("sequence"));

  it("returns review save success only after persistence and revalidation", async () => {
    const form = data({
      operation: "saveReview",
      id: "1",
      summary: "Synthetic",
      insights: "",
      followUps: "",
    });
    expect(await saveMeetingCommand({}, form)).toEqual({
      message: "Review saved.",
    });
    expect(mocks.mutate).toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("stays on edit page without redirecting when returnToDetail is false", async () => {
    const form = data({
      operation: "updateMeeting",
      id: "1",
      sessionCode: "lab",
      title: "Synthetic updated",
      returnToDetail: "false",
    });
    expect(await saveMeetingCommand({}, form)).toEqual({
      message: "Meeting changes saved.",
    });
    expect(mocks.mutate).toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rethrows P2025 on delete operations so the route error boundary handles stale deletion", async () => {
    mocks.mutate.mockRejectedValue({ code: "P2025" });
    const form = data({
      operation: "deleteMeeting",
      id: "1",
      confirmation: "on",
    });
    await expect(saveMeetingCommand({}, form)).rejects.toThrow(
      "The meeting could not be deleted because it no longer exists.",
    );
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
