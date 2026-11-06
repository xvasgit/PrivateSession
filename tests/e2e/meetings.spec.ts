import { fixtureUser, removeFixtureUser } from "../support/auth-fixtures";
import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client";

test.skip(
  process.env.PLAYWRIGHT_DATABASE !== "1",
  "Opt in to the owned local database lab with PLAYWRIGHT_DATABASE=1.",
);
const prefix = `M06-BROWSER-${randomUUID()}`;
let db: PrismaClient;
let account: Awaited<ReturnType<typeof fixtureUser>>;

test.beforeAll(async () => {
  if (process.env.PLAYWRIGHT_DATABASE !== "1") return;
  await import("../../scripts/load-lab-env");
  const { localDatabaseUrl } = await import("../../lib/database/lab-config");
  const url = localDatabaseUrl(process.env.DATABASE_URL);
  if (decodeURIComponent(new URL(url).pathname) !== "/privatesession_dev")
    throw new Error("Use the dedicated local development lab database.");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../../generated/prisma/client");
  db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      connectionTimeoutMillis: 5000,
    }),
    log: [],
    errorFormat: "minimal",
  });
  account = await fixtureUser(db);
});
test.afterAll(async () => {
  if (!db) return;
  try {
    await db.$transaction(async (tx) => {
      // Include exact unique prefix fixtures if a browser failed before its redirect.
      const owned = await tx.meetingSession.findMany({
        where: { ownerId: account.id, sessionCode: { startsWith: prefix } },
        select: { id: true },
      });
      const ownIds = owned.map((row) => row.id);
      await tx.transcriptSegment.deleteMany({
        where: { sessionId: { in: ownIds } },
      });
      await tx.meetingSession.deleteMany({ where: { id: { in: ownIds } } });
    });
  } catch {
    throw new Error(
      "Browser fixture cleanup failed; inspect this run's M06-BROWSER records locally.",
    );
  } finally {
    if (account) await removeFixtureUser(db, account.id);
    await db.$disconnect();
  }
});

async function signIn(page: Page) {
  await page.goto("/sign-in/");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  const response = page.waitForResponse((r) =>
    r.url().includes("/api/auth/sign-in/email"),
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  if ((await response).status() === 429) {
    await new Promise((resolve) => setTimeout(resolve, 11000));
    await page.getByRole("button", { name: "Sign in" }).click();
  }
  await expect(page).toHaveURL(/\/meetings\/$/);
  await expect(
    page.getByRole("heading", { name: "Meetings", exact: true }),
  ).toBeVisible();
}
async function fillMeeting(page: Page, suffix: string) {
  await page.goto("/meetings/new/");
  await page
    .getByLabel("Session code", { exact: true })
    .fill(`${prefix}-${suffix}`);
  await page
    .getByLabel("Meeting title", { exact: true })
    .fill(`Synthetic ${suffix}`);
}
async function createMeeting(page: Page, suffix: string) {
  await fillMeeting(page, suffix);
  await page
    .getByRole("button", { name: "Create meeting", exact: true })
    .click();
  await expect(page).toHaveURL(/\/meetings\/\d+\/$/);
  const id = Number(new URL(page.url()).pathname.split("/")[2]);
  return id;
}
function addForm(page: Page) {
  return page.locator("form").filter({
    has: page.getByRole("button", { name: "Add segment", exact: true }),
  });
}

test("manual review saves encrypted text, survives reload, edits and clears", async ({
  page,
}) => {
  await signIn(page);
  const id = await createMeeting(page, "review");
  await expect(page.getByText("No summary added yet.")).toBeVisible();
  await page.getByText("Edit review", { exact: true }).click();
  const form = page.getByRole("form", { name: "Save review", exact: true });
  const summary = "Synthetic manual summary — 安全\nSecond line";
  await form.getByLabel("Summary", { exact: true }).fill(summary);
  await form.getByLabel("Insights", { exact: true }).fill("Synthetic insight");
  await form
    .getByLabel("Follow-ups", { exact: true })
    .fill("Synthetic follow-up");
  await form.getByRole("button", { name: "Save review" }).click();
  await expect(form.getByRole("status")).toHaveText("Review saved.");
  const before = await db.meetingSession.findUniqueOrThrow({ where: { id } });
  expect(before.reviewIv).toHaveLength(12);
  expect(
    Buffer.from(before.reviewCiphertext!).includes(Buffer.from("Synthetic")),
  ).toBe(false);
  await page.reload();
  await expect(page.locator("#summary p")).toHaveText(summary);
  await page.getByText("Edit review", { exact: true }).click();
  await form
    .getByLabel("Summary", { exact: true })
    .fill("Updated synthetic summary");
  await form.getByRole("button", { name: "Save review" }).click();
  await expect(form.getByRole("status")).toHaveText("Review saved.");
  const after = await db.meetingSession.findUniqueOrThrow({ where: { id } });
  expect(
    Buffer.from(after.reviewIv!).equals(Buffer.from(before.reviewIv!)),
  ).toBe(false);
  for (const label of ["Summary", "Insights", "Follow-ups"])
    await form.getByLabel(label, { exact: true }).fill("");
  await form.getByRole("button", { name: "Save review" }).click();
  await expect(page.locator("#summary p")).toHaveText("No summary added yet.");
  const cleared = await db.meetingSession.findUniqueOrThrow({ where: { id } });
  expect(cleared.reviewCiphertext).toBeNull();
  expect(cleared.reviewIv).toBeNull();
});

test("review pending, retry, server validation and tampering leave stored data safe", async ({
  page,
}) => {
  await signIn(page);
  const id = await createMeeting(page, "review-errors");
  await page.getByText("Edit review", { exact: true }).click();
  const form = page.getByRole("form", { name: "Save review", exact: true });
  await form
    .getByLabel("Summary", { exact: true })
    .fill("Synthetic retry note");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/meetings/${id}/`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await gate;
    await route.abort("failed");
  });
  await form.getByRole("button").click();
  await expect(form.getByRole("button", { name: "Saving…" })).toBeDisabled();
  release();
  await expect(form.getByRole("status")).toContainText(
    "Your entries are still here",
  );
  await expect(form.getByLabel("Summary", { exact: true })).toHaveValue(
    "Synthetic retry note",
  );
  expect(
    (await db.meetingSession.findUniqueOrThrow({ where: { id } }))
      .reviewCiphertext,
  ).toBeNull();
  await page.unroute(`**/meetings/${id}/`);
  await form.getByRole("button").click();
  await expect(form.getByRole("status")).toHaveText("Review saved.");
  const original = await db.meetingSession.findUniqueOrThrow({ where: { id } });
  await form.evaluate((el: HTMLFormElement) => {
    el.noValidate = true;
    el.querySelector('textarea[name="summary"]')!.removeAttribute("maxlength");
  });
  await form.getByLabel("Summary", { exact: true }).fill("x".repeat(10001));
  await form.getByRole("button").click();
  await expect(form.getByLabel("Summary", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(
    (await db.meetingSession.findUniqueOrThrow({ where: { id } }))
      .reviewCiphertext,
  ).toEqual(original.reviewCiphertext);
  await form
    .getByLabel("Summary", { exact: true })
    .fill("Replacement must not overwrite corrupt data");
  const damaged = Uint8Array.from(original.reviewCiphertext!);
  damaged[0] ^= 1;
  await db.meetingSession.update({
    where: { id },
    data: { reviewCiphertext: damaged },
  });
  await form.getByRole("button").click();
  await expect(form.getByRole("status")).toContainText("could not be changed");
  expect(
    (await db.meetingSession.findUniqueOrThrow({ where: { id } }))
      .reviewCiphertext,
  ).toEqual(damaged);
  await page.reload();
  await expect(page.locator("p[role=alert]")).toContainText(
    "Editing is blocked",
  );
  await expect(page.getByText("Edit review", { exact: true })).toHaveCount(0);
});

test("logout revokes the cookie and replay cannot reopen saved meetings", async ({
  page,
  context,
}) => {
  await signIn(page);
  const id = await createMeeting(page, "logout");
  const saved = (await context.cookies()).find((c) =>
    c.name.endsWith("private-session.session_token"),
  )!;
  expect(saved.httpOnly).toBe(true);
  expect(saved.sameSite).toBe("Lax");
  expect(saved.secure).toBe(!process.env.PLAYWRIGHT_DEV);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  await expect
    .poll(async () =>
      (await context.cookies()).some((c) => c.name === saved.name),
    )
    .toBe(false);
  await context.addCookies([saved]);
  await page.goto(`/meetings/${id}/`);
  await expect(page).toHaveURL(/\/sign-in\/$/);
  expect(await db.meetingSession.count({ where: { id } })).toBe(1);
});

test("meeting workflow permits only intended same-origin text forms, authentication and session cookie", async ({
  page,
  context,
  baseURL,
}) => {
  const violations: string[] = [];
  await page.addInitScript(() => {
    const fail = () => {
      throw new Error("Forbidden meeting-lab media/storage operation");
    };
    FileReader.prototype.readAsText = fail;
    FileReader.prototype.readAsArrayBuffer = fail;
    FileReader.prototype.readAsDataURL = fail;
    Blob.prototype.text = fail;
    Blob.prototype.arrayBuffer = fail;
    Blob.prototype.stream = fail;
    Storage.prototype.setItem = fail;
    indexedDB.open = fail;
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = fail;
      navigator.mediaDevices.getDisplayMedia = fail;
    }
  });
  page.on("pageerror", () => violations.push("page error"));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== new URL(baseURL!).origin)
      violations.push("external request");
    if (
      !["GET", "HEAD"].includes(request.method()) &&
      (request.method() !== "POST" ||
        !(
          url.pathname === "/api/auth/sign-in/email/" ||
          (url.pathname === "/meetings/new/" &&
            request.headers()["next-action"])
        ) ||
        (request.postData() ?? "").includes("filename="))
    )
      violations.push("unexpected transmission");
  });
  await signIn(page);
  await createMeeting(page, "privacy");
  expect(violations).toEqual([]);
  expect(
    (await context.cookies()).every((cookie) =>
      cookie.name.endsWith("private-session.session_token"),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test("persistent CRUD, encrypted edits, restriction and confirmed transaction", async ({
  page,
}) => {
  await signIn(page);
  const id = await createMeeting(page, "crud");
  await expect(page.getByText("No transcript segments yet.")).toBeVisible();
  const form = addForm(page);
  await form.getByLabel("Sequence number").fill("1");
  await form
    .getByLabel("Transcript text")
    .fill("Synthetic segment first version.");
  await form.getByRole("button", { name: "Add segment" }).click();
  await expect(
    page.getByRole("heading", { name: "Segment 1", exact: true }),
  ).toBeVisible();
  const before = await db.transcriptSegment.findFirstOrThrow({
    where: { sessionId: id },
  });
  expect(
    Buffer.from(before.contentCiphertext).includes(
      Buffer.from("Synthetic segment"),
    ),
  ).toBe(false);
  await page.getByText("Edit segment 1", { exact: true }).click();
  const edit = page.locator("details").filter({ hasText: "Edit segment 1" });
  await edit.getByLabel("Transcript text").fill("Synthetic updated segment.");
  await edit.getByRole("button", { name: "Save segment" }).click();
  await expect(
    page.locator("p").filter({ hasText: /^Synthetic updated segment\.$/ }),
  ).toBeVisible();
  const after = await db.transcriptSegment.findUniqueOrThrow({
    where: { id: before.id },
  });
  expect(Buffer.from(after.iv).equals(Buffer.from(before.iv))).toBe(false);
  await page.getByRole("link", { name: "Edit meeting", exact: true }).click();
  await page.getByLabel("Meeting title", { exact: true }).fill("S".repeat(80));
  await page
    .getByLabel("Session code", { exact: true })
    .fill(prefix.padEnd(64, "X"));
  await page.getByRole("button", { name: "Save meeting", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "S".repeat(80),
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator("p").filter({ hasText: /^Synthetic updated segment\.$/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel("Confirm deletion of this empty meeting", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Delete empty meeting", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "relationship prevents" }),
  ).toBeVisible();
  await page
    .getByLabel("Confirm deletion of segment 1", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Delete segment 1", exact: true })
    .click();
  await expect(page.getByText("No transcript segments yet.")).toBeVisible();
  await form.getByLabel("Sequence number").fill("2");
  await form
    .getByLabel("Transcript text")
    .fill("Synthetic transaction segment.");
  await form.getByRole("button", { name: "Add segment" }).click();
  await expect(
    page.getByRole("heading", { name: "Segment 2", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("I confirm deletion of this session and all its segments")
    .check();
  await page
    .getByRole("button", {
      name: "Delete session and all segments",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/meetings\/$/);
  expect(await db.meetingSession.count({ where: { id } })).toBe(0);
  expect(await db.transcriptSegment.count({ where: { sessionId: id } })).toBe(
    0,
  );
});

test("server validation, P2002, retained inputs and real stale-form P2025", async ({
  page,
}) => {
  await signIn(page);
  const id = await createMeeting(page, "errors");
  await fillMeeting(page, "errors");
  await page
    .getByRole("button", { name: "Create meeting", exact: true })
    .click();
  await expect(
    page.getByText(
      "Session code already exists in your library (case-sensitive).",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Meeting title", { exact: true })).toHaveValue(
    "Synthetic errors",
  );
  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "Create meeting", exact: true }),
  });
  await form.evaluate((el: HTMLFormElement) => {
    el.noValidate = true;
  });
  await page.getByLabel("Meeting title", { exact: true }).fill("ab");
  await page
    .getByRole("button", { name: "Create meeting", exact: true })
    .click();
  await expect(
    page.getByLabel("Meeting title", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await page.goto(`/meetings/${id}/`);
  await addForm(page).getByLabel("Sequence number").fill("1");
  await addForm(page)
    .getByLabel("Transcript text")
    .fill("Synthetic unique sequence.");
  await addForm(page).getByRole("button", { name: "Add segment" }).click();
  await expect(
    page.getByRole("heading", { name: "Segment 1", exact: true }),
  ).toBeVisible();
  await addForm(page).getByLabel("Sequence number").fill("1");
  await addForm(page)
    .getByLabel("Transcript text")
    .fill("Synthetic duplicate sequence.");
  await addForm(page).getByRole("button", { name: "Add segment" }).click();
  await expect(
    page.getByText("Sequence already exists in this session."),
  ).toBeVisible();
  const all = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Delete session and all segments",
      exact: true,
    }),
  });
  await all.evaluate((el: HTMLFormElement) => {
    el.noValidate = true;
  });
  await all.getByRole("button").click();
  await expect(
    page.getByText("Confirm deletion of this session and all its segments.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/meetings/${id}/edit/`);
  await db.transcriptSegment.deleteMany({ where: { sessionId: id } });
  await db.meetingSession.delete({ where: { id } });
  await page.getByRole("button", { name: "Save meeting", exact: true }).click();
  await expect(
    page.getByText(
      "This record is no longer available. Return to the meeting list and refresh.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Meeting title", { exact: true })).toHaveValue(
    "Synthetic errors",
  );
});

test("pending, network retry, authenticated action and invalid route guards", async ({
  page,
  context,
}) => {
  for (const route of [
    "/meetings/",
    "/meetings/new/",
    "/meetings/1/",
    "/meetings/1/edit/",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/sign-in\/$/);
  }
  await signIn(page);
  await fillMeeting(page, "retry");
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/meetings/new/", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await gate;
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Create meeting", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("status").filter({ hasText: "Saving your changes" }),
  ).toBeVisible();
  release();
  await expect(page.getByText(/Your entries are still here/)).toBeVisible();
  await expect(page.getByLabel("Session code", { exact: true })).toHaveValue(
    `${prefix}-retry`,
  );
  await page.unroute("**/meetings/new/");
  await page
    .getByRole("button", { name: "Create meeting", exact: true })
    .click();
  await expect(page).toHaveURL(/\/meetings\/\d+\/$/);
  const id = Number(new URL(page.url()).pathname.split("/")[2]);
  await page.goto("/meetings/not-an-id/");
  await expect(
    page.getByRole("heading", { name: "Meeting not found" }),
  ).toBeVisible();
  await page.goto(`/meetings/${id}/edit/`);
  await context.addCookies([
    {
      name: (await context.cookies()).find((c) =>
        c.name.endsWith("private-session.session_token"),
      )!.name,
      value: "forged",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: !process.env.PLAYWRIGHT_DEV,
      sameSite: "Lax",
    },
  ]);
  await page.getByRole("button", { name: "Save meeting", exact: true }).click();
  await expect(
    page.getByText("Please sign in again. No change was made."),
  ).toBeVisible();
  await page.goto(`/meetings/${id}/`);
  await expect(page).toHaveURL(/\/sign-in\/$/);
});

test("corrupt stored transcript fails closed without fabricated text", async ({
  page,
}) => {
  await signIn(page);
  const id = await createMeeting(page, "corrupt");
  await addForm(page).getByLabel("Sequence number").fill("1");
  await addForm(page)
    .getByLabel("Transcript text")
    .fill("Synthetic authentication check.");
  await addForm(page).getByRole("button", { name: "Add segment" }).click();
  await expect(
    page.getByRole("heading", { name: "Segment 1", exact: true }),
  ).toBeVisible();
  const row = await db.transcriptSegment.findFirstOrThrow({
    where: { sessionId: id },
  });
  const changed = new Uint8Array(row.contentCiphertext);
  changed[0] ^= 1;
  await db.transcriptSegment.update({
    where: { id: row.id },
    data: { contentCiphertext: changed },
  });
  await page.reload();
  await expect(page.locator("p[role=alert]")).toContainText(
    "could not be authenticated and decrypted",
  );
  await expect(
    page.getByText("Synthetic authentication check.", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Edit segment 1", { exact: true })).toHaveCount(
    0,
  );
});
