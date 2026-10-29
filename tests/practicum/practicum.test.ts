import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  set: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      mocks.jar.has(name) ? { value: mocks.jar.get(name) } : undefined,
    set: (name: string, value: string, options: { maxAge: number }) => {
      mocks.set(name, value, options);
      if (options.maxAge === 0) mocks.jar.delete(name);
      else mocks.jar.set(name, value);
    },
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("redirect:" + path);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { NextRequest } from "next/server";
import { proxy } from "../../proxy";
import { reviewRequestSchema, meetingTypes } from "../../lib/practicum/schema";
import {
  PracticumStore,
  practicumStore,
  SESSION_SECONDS,
} from "../../lib/practicum/store.server";
import { createDemoRequest } from "../../app/upload/practicum/actions";
import { demoSignIn, demoSignOut } from "../../app/demo-sign-in/actions";
import {
  DEMO_COOKIE,
  demoCookieOptions,
  readDemoSession,
  requireDemoSession,
} from "../../lib/practicum/session.server";

const valid = {
  title: "Synthetic review",
  meetingType: "Lecture",
  context: "A synthetic review context.",
  confirmation: "on",
};
function form(values: Record<string, string> = valid) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
beforeEach(() => {
  mocks.jar.clear();
  mocks.set.mockClear();
  mocks.revalidate.mockClear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("practicum schemas", () => {
  it.each([
    ["short title", { title: "ab" }],
    ["long title", { title: "x".repeat(81) }],
    ["blank title", { title: "   " }],
    ["invalid type", { meetingType: "Unknown" }],
    ["short context", { context: "123456789" }],
    ["long context", { context: "x".repeat(501) }],
    ["unchecked", { confirmation: "off" }],
    ["malformed checkbox", { confirmation: "unknown" }],
  ])("rejects %s", (_name, override) => {
    expect(
      reviewRequestSchema.safeParse({ ...valid, ...override }).success,
    ).toBe(false);
  });
  it("rejects missing confirmation and non-string fields", () => {
    const missing = {
      title: valid.title,
      meetingType: valid.meetingType,
      context: valid.context,
    };
    expect(reviewRequestSchema.safeParse(missing).success).toBe(false);
    expect(
      reviewRequestSchema.safeParse({ ...valid, title: new File(["x"], "x") })
        .success,
    ).toBe(false);
  });
  it.each(meetingTypes)(
    "accepts %s and strips unknown fields",
    (meetingType) => {
      const result = reviewRequestSchema.parse({
        ...valid,
        meetingType,
        title: "  abc  ",
        context: "a".repeat(10),
        owner: "forged",
      });
      expect(result.title).toBe("abc");
      expect(result.confirmation).toBe(true);
      expect(result).not.toHaveProperty("owner");
      expect(
        reviewRequestSchema.safeParse({
          ...valid,
          title: "x".repeat(80),
          context: "x".repeat(500),
        }).success,
      ).toBe(true);
    },
  );
});

describe("temporary records and session lifecycle", () => {
  it("starts empty, enforces per-owner uniqueness and ownership, and returns copies", () => {
    const store = new PracticumStore();
    const input = reviewRequestSchema.parse(valid);
    expect(store.listRecords("one")).toEqual([]);
    const record = store.createRecord("one", input)!;
    expect(
      store.createRecord("one", { ...input, title: input.title.toUpperCase() }),
    ).toBeNull();
    expect(store.createRecord("two", input)).not.toBeNull();
    expect(store.findRecord("two", record.id)).toBeUndefined();
    record.title = "modified";
    expect(store.findRecord("one", record.id)?.title).toBe(input.title);
    expect(store.listRecords("one")).toHaveLength(1);
    expect(new PracticumStore().listRecords("one")).toEqual([]);
  });
  it("rotates, expires, revokes and rejects forged/missing sessions", () => {
    vi.useFakeTimers();
    const store = new PracticumStore();
    const first = store.createSession("one");
    const second = store.createSession("one", first);
    expect(first).not.toBe(second);
    expect(store.readSession(first)).toBeNull();
    expect(store.readSession()).toBeNull();
    expect(store.readSession("forged")).toBeNull();
    expect(store.readSession(second)?.owner).toBe("one");
    vi.advanceTimersByTime(SESSION_SECONDS * 1000);
    expect(store.readSession(second)).toBeNull();
    const third = store.createSession("one");
    store.revokeSession(third);
    expect(store.readSession(third)).toBeNull();
    expect(new PracticumStore().readSession(third)).toBeNull();
  });
  it.each(["development", "production"])(
    "sets expected cookie attributes in %s",
    (mode) => {
      vi.stubEnv("NODE_ENV", mode);
      expect(demoCookieOptions()).toEqual({
        httpOnly: true,
        sameSite: "lax",
        secure: mode === "production",
        path: "/",
        maxAge: 28800,
      });
    },
  );
});

describe("server actions independently enforce validation and authorization", () => {
  it("rejects missing or forged sessions before validating input", async () => {
    expect((await createDemoRequest({}, form({}))).message).toMatch(/sign in/);
    mocks.jar.set(DEMO_COOKIE, "forged");
    expect((await createDemoRequest({}, form())).message).toMatch(/sign in/);
    await expect(requireDemoSession()).rejects.toThrow(
      "redirect:/demo-sign-in/",
    );
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("rejects expired sessions", async () => {
    vi.useFakeTimers();
    mocks.jar.set(DEMO_COOKIE, practicumStore.createSession("expiry-test"));
    vi.advanceTimersByTime(SESSION_SECONDS * 1000);
    expect((await createDemoRequest({}, form())).message).toMatch(/sign in/);
  });
  it.each([
    ["title", { ...valid, title: "ab" }],
    ["meetingType", { ...valid, meetingType: "forged" }],
    ["context", { ...valid, context: "" }],
    [
      "confirmation",
      {
        title: valid.title,
        meetingType: valid.meetingType,
        context: valid.context,
      },
    ],
  ])("rejects invalid %s without mutation", async (field, values) => {
    const owner = crypto.randomUUID();
    mocks.jar.set(DEMO_COOKIE, practicumStore.createSession(owner));
    const result = await createDemoRequest({}, form(values));
    expect(result.fieldErrors).toHaveProperty(field);
    expect(practicumStore.listRecords(owner)).toEqual([]);
  });
  it("derives owner from session, creates, revalidates then redirects; duplicate is rejected", async () => {
    const owner = crypto.randomUUID();
    mocks.jar.set(DEMO_COOKIE, practicumStore.createSession(owner));
    await expect(
      createDemoRequest({}, form({ ...valid, owner: "forged" })),
    ).rejects.toThrow("redirect:/upload/practicum/");
    expect(mocks.revalidate).toHaveBeenCalledWith("/upload/practicum");
    expect(practicumStore.listRecords(owner)).toHaveLength(1);
    expect(practicumStore.listRecords("forged")).toEqual([]);
    const duplicate = await createDemoRequest(
      {},
      form({ ...valid, title: valid.title.toUpperCase() }),
    );
    expect(duplicate.fieldErrors?.title).toBeDefined();
    expect(practicumStore.listRecords(owner)).toHaveLength(1);
  });
  it("hides storage errors and permits a retry", async () => {
    const owner = crypto.randomUUID();
    mocks.jar.set(DEMO_COOKIE, practicumStore.createSession(owner));
    vi.spyOn(practicumStore, "createRecord").mockImplementationOnce(() => {
      throw new Error("private contents");
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await createDemoRequest({}, form());
    expect(result.message).toMatch(/retry/);
    expect(JSON.stringify(result)).not.toContain("private contents");
    expect(log).toHaveBeenCalledWith("Demo request creation failed.");
    await expect(createDemoRequest({}, form())).rejects.toThrow("redirect:");
  });
  it("fails closed for absent config and rejects invalid or incorrect credentials", async () => {
    vi.stubEnv("DEMO_EMAIL", "");
    vi.stubEnv("DEMO_PASSWORD", "");
    expect((await demoSignIn({}, form({}))).message).toMatch(/not configured/);
    vi.stubEnv("DEMO_EMAIL", "lab@example.invalid");
    vi.stubEnv("DEMO_PASSWORD", "synthetic-only-password");
    expect(
      (await demoSignIn({}, form({ email: "bad", password: "short" })))
        .fieldErrors,
    ).toBeDefined();
    expect(
      (
        await demoSignIn(
          {},
          form({ email: "lab@example.invalid", password: "wrong-password" }),
        )
      ).message,
    ).toMatch(/incorrect/);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("signs in, rotates and logs out; replay cannot recreate session", async () => {
    vi.stubEnv("DEMO_EMAIL", "lab@example.invalid");
    vi.stubEnv("DEMO_PASSWORD", "synthetic-only-password");
    const credentials = form({
      email: "lab@example.invalid",
      password: "synthetic-only-password",
    });
    await expect(demoSignIn({}, credentials)).rejects.toThrow(
      "redirect:/upload/practicum/",
    );
    const old = mocks.jar.get(DEMO_COOKIE)!;
    await expect(demoSignIn({}, credentials)).rejects.toThrow("redirect:");
    expect(practicumStore.readSession(old)).toBeNull();
    const current = mocks.jar.get(DEMO_COOKIE)!;
    expect((await readDemoSession())?.owner).toBe("lab@example.invalid");
    await expect(demoSignOut()).rejects.toThrow("redirect:/");
    expect(mocks.jar.has(DEMO_COOKIE)).toBe(false);
    mocks.jar.set(DEMO_COOKIE, current);
    expect(await readDemoSession()).toBeNull();
  });
  it("proxy checks only presence; forged cookie still fails authoritative validation", () => {
    expect(
      proxy(
        new NextRequest("http://localhost/upload/practicum/new/"),
      ).headers.get("location"),
    ).toBe("http://localhost/demo-sign-in/");
    expect(
      proxy(
        new NextRequest("http://localhost/upload/practicum/new/", {
          headers: { cookie: "private-session-demo=forged" },
        }),
      ).headers.get("location"),
    ).toBeNull();
  });
});
