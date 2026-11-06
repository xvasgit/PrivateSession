import { describe, expect, it, vi } from "vitest";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import {
  signInSchema,
  createMemberSchema,
  profileSchema,
  changePasswordSchema,
} from "../lib/auth/schemas";
import { verifyActor } from "../lib/auth/authorization";
import type { Prisma } from "../generated/prisma/client";

describe("persistent account rules", () => {
  it("normalizes email but preserves password whitespace", () => {
    expect(
      signInSchema.parse({
        email: " MEMBER@EXAMPLE.INVALID ",
        password: " a long password ",
      }),
    ).toEqual({
      email: "member@example.invalid",
      password: " a long password ",
    });
  });
  it.each(["", "a".repeat(11), "a".repeat(129)])(
    "rejects password boundary %s",
    (password) => {
      expect(
        signInSchema.safeParse({ email: "member@example.invalid", password })
          .success,
      ).toBe(false);
    },
  );
  it.each([12, 128])("accepts password length %i", (length) => {
    expect(
      signInSchema.safeParse({
        email: "member@example.invalid",
        password: "a".repeat(length),
      }).success,
    ).toBe(true);
  });
  it("does not accept role, status, identity or email changes through profile/provisioning", () => {
    for (const field of [
      "role",
      "status",
      "userId",
      "mustChangePassword",
      "email",
    ])
      expect(
        profileSchema.safeParse({ name: "Member", [field]: "injected" })
          .success,
      ).toBe(false);
    expect(
      createMemberSchema.safeParse({
        name: "Member",
        email: "member@example.invalid",
        password: "long-password",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });
  it("requires distinct matching replacement passwords", () => {
    const input = {
      currentPassword: "original-password",
      newPassword: "replacement-password",
      confirmation: "replacement-password",
    };
    expect(changePasswordSchema.safeParse(input).success).toBe(true);
    expect(
      changePasswordSchema.safeParse({
        ...input,
        confirmation: "different-password",
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        ...input,
        newPassword: input.currentPassword,
        confirmation: input.currentPassword,
      }).success,
    ).toBe(false);
  });
  it("uses independently salted slow password hashes and rejects wrong passwords", async () => {
    const password = "synthetic-unit-password";
    const a = await hashPassword(password),
      b = await hashPassword(password);
    expect(a).not.toEqual(b);
    expect(a).not.toContain(password);
    expect(await verifyPassword({ hash: a, password })).toBe(true);
    expect(
      await verifyPassword({ hash: a, password: "incorrect-password" }),
    ).toBe(false);
  });
  it.each([
    "disabled",
    "expired",
    "initial",
    "member-admin",
    "missing",
    "invalid-role",
  ])("fails closed for %s", async (scenario) => {
    const tx = {
      $queryRaw: vi.fn(),
      user: {
        findUnique: vi.fn().mockResolvedValue(
          scenario === "missing"
            ? null
            : {
                role: scenario === "invalid-role" ? "OTHER" : "MEMBER",
                status: scenario === "disabled" ? "DISABLED" : "ACTIVE",
                mustChangePassword: scenario === "initial",
              },
        ),
      },
      session: {
        findFirst: vi
          .fn()
          .mockResolvedValue(scenario === "expired" ? null : { id: "s" }),
      },
    };
    await expect(
      verifyActor(
        tx as unknown as Prisma.TransactionClient,
        { userId: "u", sessionId: "s" },
        scenario === "member-admin",
      ),
    ).rejects.toThrow("not available");
  });
});
