import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client";

test.skip(
  process.env.PLAYWRIGHT_DATABASE !== "1",
  "Opt in to the owned local database lab with PLAYWRIGHT_DATABASE=1.",
);
const prefix = `M06-BROWSER-${randomUUID()}`;
let db: PrismaClient;

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
});
test.afterAll(async () => {
  if (!db) return;
  try {
    await db.$transaction(async (tx) => {
      // Include exact unique prefix fixtures if a browser failed before its redirect.
      const owned = await tx.meetingSession.findMany({
        where: { sessionCode: { startsWith: prefix } },
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
    await db.$disconnect();
  }
});

async function signIn(page: Page) {
  await page.goto("/demo-sign-in/");
  await page
    .getByLabel("Demo email", { exact: true })
    .fill(process.env.PRACTICUM_TEST_EMAIL!);
  await page
    .getByLabel("Demo password", { exact: true })
    .fill(process.env.PRACTICUM_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign in to demo" }).click();
  await expect(page).toHaveURL(/\/upload\/practicum\/$/);
  await page
    .getByRole("link", { name: "Open the Module 6 meeting lab" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Meeting sessions", exact: true }),
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

test("meeting lab permits only intended same-origin text forms and demo cookie", async ({
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
        !["/demo-sign-in/", "/meetings/new/"].includes(url.pathname) ||
        !request.headers()["next-action"] ||
        (request.postData() ?? "").includes("filename="))
    )
      violations.push("unexpected transmission");
  });
  await signIn(page);
  await createMeeting(page, "privacy");
  expect(violations).toEqual([]);
  expect(
    (await context.cookies()).every(
      (cookie) => cookie.name === "private-session-demo",
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
    .getByLabel("Synthetic transcript text")
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
  const edit = page.locator("details");
  await edit
    .getByLabel("Synthetic transcript text")
    .fill("Synthetic updated segment.");
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
    .getByRole("button", { name: "Delete empty meeting", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "relationship prevents" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete segment 1", exact: true })
    .click();
  await expect(page.getByText("No transcript segments yet.")).toBeVisible();
  await form.getByLabel("Sequence number").fill("2");
  await form
    .getByLabel("Synthetic transcript text")
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
    page.getByText("Session code already exists (case-sensitive)."),
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
    .getByLabel("Synthetic transcript text")
    .fill("Synthetic unique sequence.");
  await addForm(page).getByRole("button", { name: "Add segment" }).click();
  await expect(
    page.getByRole("heading", { name: "Segment 1", exact: true }),
  ).toBeVisible();
  await addForm(page).getByLabel("Sequence number").fill("1");
  await addForm(page)
    .getByLabel("Synthetic transcript text")
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
    await expect(page).toHaveURL(/\/demo-sign-in\/$/);
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
    page.getByRole("status").filter({ hasText: "Saving the lab change" }),
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
      name: "private-session-demo",
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
    page.getByText("Please sign in to the demo again. No change was made."),
  ).toBeVisible();
  await page.goto(`/meetings/${id}/`);
  await expect(page).toHaveURL(/\/demo-sign-in\/$/);
});

test("corrupt stored transcript fails closed without fabricated text", async ({
  page,
}) => {
  await signIn(page);
  const id = await createMeeting(page, "corrupt");
  await addForm(page).getByLabel("Sequence number").fill("1");
  await addForm(page)
    .getByLabel("Synthetic transcript text")
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
