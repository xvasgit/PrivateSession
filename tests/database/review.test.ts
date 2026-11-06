import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../../generated/prisma/client";
import { mutateMeeting } from "../../lib/meetings/repository";
import { commands } from "../../lib/meetings/schema";
const actor = { userId: "synthetic", sessionId: "session" };
const command = {
  operation: "saveReview",
  id: 1,
  summary: "Synthetic",
  insights: "",
  followUps: "",
} as const;
function setup(existing = true) {
  const row = {
    id: 1,
    reviewCiphertext: existing ? new Uint8Array([1]) : null,
    reviewIv: existing ? new Uint8Array(12) : null,
  };
  const tx = {
    $queryRaw: vi.fn(),
    user: {
      findUnique: vi.fn().mockResolvedValue({
        role: "MEMBER",
        status: "ACTIVE",
        mustChangePassword: false,
      }),
    },
    session: { findFirst: vi.fn().mockResolvedValue({ id: "session" }) },
    meetingSession: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(row),
      update: vi.fn(),
    },
  };
  const db = {
    $transaction: (work: (v: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient;
  const crypto = {
    open: vi.fn().mockResolvedValue({}),
    seal: vi.fn().mockResolvedValue({
      reviewCiphertext: new Uint8Array([2]),
      reviewIv: new Uint8Array(12),
    }),
  };
  return { tx, db, crypto };
}
describe("review mutation", () => {
  it("does not encrypt or write when existing review authentication fails", async () => {
    const { tx, db, crypto } = setup();
    crypto.open.mockRejectedValue(new Error("authentication"));
    await expect(
      mutateMeeting(db, actor, vi.fn(), command, crypto),
    ).rejects.toThrow("authentication");
    expect(crypto.seal).not.toHaveBeenCalled();
    expect(tx.meetingSession.update).not.toHaveBeenCalled();
  });
  it("also rejects clearing an unreadable review without a write", async () => {
    const { tx, db, crypto } = setup();
    crypto.open.mockRejectedValue(new Error("authentication"));
    await expect(
      mutateMeeting(db, actor, vi.fn(), { ...command, summary: "" }, crypto),
    ).rejects.toThrow();
    expect(tx.meetingSession.update).not.toHaveBeenCalled();
  });
  it("clears authenticated notes atomically", async () => {
    const { tx, db, crypto } = setup();
    await mutateMeeting(
      db,
      actor,
      vi.fn(),
      { ...command, summary: "" },
      crypto,
    );
    expect(tx.meetingSession.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { reviewCiphertext: null, reviewIv: null },
    });
    expect(crypto.seal).not.toHaveBeenCalled();
  });
  it("does not upsert a deleted meeting", async () => {
    const { tx, db, crypto } = setup(false);
    tx.meetingSession.findUniqueOrThrow.mockRejectedValue({ code: "P2025" });
    await expect(
      mutateMeeting(db, actor, vi.fn(), command, crypto),
    ).rejects.toMatchObject({ code: "P2025" });
    expect(tx.meetingSession.update).not.toHaveBeenCalled();
  });
  it("validates review commands and rejects unconfirmed deletes", () => {
    expect(commands.parse({ ...command, id: "1", extra: "ignored" })).toEqual(
      command,
    );
    for (const operation of ["deleteMeeting", "deleteSegment", "deleteAll"])
      expect(
        commands.safeParse({ operation, id: "1", sessionId: "1" }).success,
      ).toBe(false);
  });
});
