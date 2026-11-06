import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { fixtureUser, removeFixtureUser } from "../support/auth-fixtures";
import { localDatabaseUrl } from "../../lib/database/lab-config";

test.skip(
  process.env.PLAYWRIGHT_DATABASE !== "1",
  "Requires the owned local database.",
);
let db: PrismaClient;
const users: string[] = [];
async function user(role = "MEMBER", initial = false) {
  const value = await fixtureUser(db, role, initial);
  users.push(value.id);
  return value;
}
test.beforeAll(async () => {
  await import("../../scripts/load-lab-env");
  db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: localDatabaseUrl(process.env.DATABASE_URL),
    }),
    log: [],
  });
});
test.afterAll(async () => {
  if (db) {
    for (const id of users) await removeFixtureUser(db, id);
    await db.$disconnect();
  }
});
async function login(
  page: Page,
  account: { email: string; password: string },
  initial = false,
) {
  await page.goto("/sign-in/");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  const response = page.waitForResponse((r) =>
    r.url().includes("/api/auth/sign-in/email"),
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const received = await response;
  if (received.status() === 429) {
    await new Promise((resolve) => setTimeout(resolve, 11000));
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  }
  await expect(page).toHaveURL(
    initial ? /\/account\/change-password\/$/ : /\/meetings\/$/,
  );
}
test("initial password, field rejection, private profile and password revocation", async ({
  page,
}) => {
  const member = await user("MEMBER", true);
  await login(page, member, true);
  await expect(
    page.getByText("Replace your initial password before accessing meetings."),
  ).toBeVisible();
  const cookie = await page.context().cookies();
  const failed = await page.request.post("/api/auth/change-password/", {
    data: { currentPassword: member.password, newPassword: randomUUID() },
    headers: { origin: new URL(page.url()).origin },
  });
  expect(failed.status()).toBe(400);
  expect((await failed.json()).fieldErrors).toHaveProperty("confirmation");
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: member.id } }))
      .mustChangePassword,
  ).toBe(true);
  const next = randomUUID();
  await page
    .getByLabel("Current password", { exact: true })
    .fill(member.password);
  await page.getByLabel("New password", { exact: true }).fill(next);
  await page.getByLabel("Confirm new password").fill(next);
  await page
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in\/\?password=changed$/);
  await page.context().addCookies(cookie);
  await page.goto("/meetings/");
  await expect(page).toHaveURL(/\/sign-in\/$/);
  await login(page, { ...member, password: next });
  await page.goto("/account/");
  await page.getByLabel("Display name").fill("Changed member name");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved.");
  await page.goto("/admin/accounts/");
  expect(await page.getByRole("heading", { name: /not found/i }).count()).toBe(
    1,
  );
});
test("administrator creates a member, cannot read their meeting, and revokes access by deactivation", async ({
  page,
  browser,
}) => {
  const admin = await user("ADMIN");
  await login(page, admin);
  await page.goto("/admin/accounts/");
  const email = `${randomUUID()}@example.invalid`;
  const password = randomUUID();
  await page.getByLabel("Display name").fill("Synthetic created member");
  await page.getByLabel("Member email").fill(email);
  await page.getByLabel("Initial password").fill(password);
  await page
    .getByRole("button", { name: "Create member", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Member created." }),
  ).toBeVisible();
  const created = await db.user.findUniqueOrThrow({ where: { email } });
  users.push(created.id);
  expect(created.role).toBe("MEMBER");
  expect(created.mustChangePassword).toBe(true);
  const member = await user();
  const record = await db.meetingSession.create({
    data: {
      ownerId: member.id,
      sessionCode: "SAME-CODE",
      title: "Other member private meeting",
    },
  });
  await page.goto(`/meetings/${record.id}/`);
  await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  const context = await browser.newContext();
  const other = await context.newPage();
  await login(other, member);
  const old = await context.cookies();
  await page.goto("/admin/accounts/");
  const row = page.getByRole("listitem").filter({ hasText: member.email });
  await row.getByRole("button", { name: "Deactivate member" }).click();
  await expect(row).toContainText("DISABLED");
  await other.goto("/meetings/");
  await expect(other).toHaveURL(/\/sign-in\/$/);
  await row.getByRole("button", { name: "Activate member" }).click();
  await expect(row).toContainText("ACTIVE");
  await context.addCookies(old);
  await other.goto("/meetings/");
  await expect(other).toHaveURL(/\/sign-in\/$/);
  await context.close();
});
test("direct cross-owner action is rejected without altering metadata or ciphertext", async ({
  page,
}) => {
  const a = await user(),
    b = await user();
  const own = await db.meetingSession.create({
    data: {
      ownerId: a.id,
      sessionCode: "PRIVATE",
      title: "Private owner meeting",
    },
  });
  const foreign = await db.meetingSession.create({
    data: {
      ownerId: b.id,
      sessionCode: "PRIVATE",
      title: "Foreign owner meeting",
    },
  });
  await login(page, a);
  await page.goto(`/meetings/${own.id}/edit/`);
  const before = await db.meetingSession.findUniqueOrThrow({
    where: { id: foreign.id },
  });
  await page.getByLabel("Meeting title").fill("Forbidden cross-owner edit");
  await page
    .getByRole("form", { name: "Save meeting", exact: true })
    .evaluate((form, id) => {
      form.addEventListener(
        "formdata",
        (event) => (event as FormDataEvent).formData.set("id", String(id)),
        { once: true },
      );
    }, foreign.id);
  await page.getByRole("button", { name: "Save meeting" }).click();
  await expect(
    page
      .getByRole("form", { name: "Save meeting", exact: true })
      .getByRole("status"),
  ).toContainText("no longer available");
  expect(
    await db.meetingSession.findUniqueOrThrow({ where: { id: foreign.id } }),
  ).toEqual(before);
  await page.goto(`/meetings/${foreign.id}/`);
  await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
});
test("credential requests reject tampering, external origins and blocked authentication endpoints", async ({
  page,
}) => {
  await page.goto("/sign-in/");
  const origin = new URL(page.url()).origin;
  const invalid = await page.request.post("/api/auth/sign-in/email/", {
    headers: { origin },
    data: { email: "invalid", password: "short", role: "ADMIN" },
  });
  expect(invalid.status()).toBe(400);
  const signup = await page.request.post("/api/auth/sign-up/email/", {
    headers: { origin },
    data: {
      name: "Forbidden",
      email: "unregistered@example.invalid",
      password: randomUUID(),
    },
  });
  expect(signup.status()).toBe(404);
  const cross = await page.request.post("/api/auth/sign-in/email/", {
    headers: { origin: "https://untrusted.example" },
    data: { email: "member@example.invalid", password: randomUUID() },
  });
  expect(cross.status()).toBe(403);
  for (const route of [
    "update-user",
    "delete-user",
    "change-email",
    "admin/impersonate-user",
    "admin/set-user-password",
  ]) {
    expect(
      (
        await page.request.post(`/api/auth/${route}/`, {
          headers: { origin },
          data: {},
        })
      ).status(),
    ).toBe(404);
  }
});
test("login pending and network retry retain selection without persistence", async ({
  page,
}) => {
  const member = await user();
  await page.goto("/sign-in/");
  await page.getByLabel("Email", { exact: true }).fill(member.email);
  await page.getByLabel("Password", { exact: true }).fill(member.password);
  await page.route("**/api/auth/sign-in/email/", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.abort();
  });
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Please wait…" }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Could not reach");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    member.email,
  );
  await page.unroute("**/api/auth/sign-in/email/");
  await login(page, member);
});
