import { expect, test, type Page } from "@playwright/test";
const cookieName = "private-session-demo";
const formValues = { context: "Synthetic classroom review context only." };

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
}
async function fillRequest(page: Page, title: string) {
  await page.goto("/upload/practicum/new/");
  await page.getByLabel("Meeting title", { exact: true }).fill(title);
  await page
    .getByLabel("Meeting type", { exact: true })
    .selectOption("Lecture");
  await page
    .getByLabel("Review context", { exact: true })
    .fill(formValues.context);
  await page.getByLabel(/I confirm this is synthetic/).check();
}
test("creates a real temporary record, refreshes the list, and rejects duplicate titles", async ({
  page,
}) => {
  await signIn(page);
  const title = "Synthetic " + crypto.randomUUID();
  await fillRequest(page, title);
  await page
    .getByRole("button", { name: "Create demo request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/practicum\/[0-9a-f-]{36}\/$/);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo — not processed", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Demo requests", exact: true }).click();
  await expect(
    page.getByRole("link", { name: title, exact: true }),
  ).toBeVisible();
  await fillRequest(page, title.toUpperCase());
  await page
    .getByRole("button", { name: "Create demo request", exact: true })
    .click();
  await expect(page.locator("#demo-title-error")).toContainText("already have");
  await expect(page.getByLabel("Meeting title", { exact: true })).toHaveValue(
    title.toUpperCase(),
  );
  await expect(page.getByLabel("Review context", { exact: true })).toHaveValue(
    formValues.context,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
for (const field of ["title", "meetingType", "confirmation"] as const) {
  test(`bypasses client validation and rejects invalid ${field} on the server`, async ({
    page,
  }) => {
    await signIn(page);
    const title = "Tamper " + crypto.randomUUID();
    await fillRequest(page, title);
    const form = page.locator("form").filter({
      has: page.getByRole("button", {
        name: "Create demo request",
        exact: true,
      }),
    });
    await form.evaluate((element: HTMLFormElement) => {
      element.noValidate = true;
    });
    if (field === "title")
      await page.getByLabel("Meeting title", { exact: true }).fill("ab");
    if (field === "meetingType") {
      await page
        .locator("#demo-type")
        .evaluate((element: HTMLSelectElement) => {
          element.add(new Option("Forged", "forged"));
        });
      await page.locator("#demo-type").selectOption("forged");
    }
    if (field === "confirmation")
      await page.getByLabel(/I confirm this is synthetic/).uncheck();
    let posts = 0;
    page.on("request", (request) => {
      if (request.method() === "POST") posts++;
    });
    await page
      .getByRole("button", { name: "Create demo request", exact: true })
      .click();
    const id =
      field === "title"
        ? "demo-title"
        : field === "meetingType"
          ? "demo-type"
          : "demo-confirmation";
    await expect(page.locator("#" + id)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.locator("#" + id + "-error")).not.toBeEmpty();
    await expect(
      page.getByRole("status").filter({ hasText: "Check the request fields." }),
    ).toBeVisible();
    expect(posts).toBe(1);
    await expect(
      page.getByLabel("Review context", { exact: true }),
    ).toHaveValue(formValues.context);
    await page.goto("/upload/practicum/");
    await expect(
      page.getByRole("link", { name: title, exact: true }),
    ).toHaveCount(0);
  });
}
test("pending blocks duplicate submissions and a failed request can be retried", async ({
  page,
}) => {
  await signIn(page);
  await fillRequest(page, "Retry " + crypto.randomUUID());
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let posts = 0;
  await page.route("**/upload/practicum/new/", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts++;
    if (posts === 1) {
      await gate;
      return route.fulfill({ status: 503, body: "Unavailable" });
    }
    await route.continue();
  });
  await page
    .getByRole("button", { name: "Create demo request", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Creating demo request…" }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Meeting title", { exact: true }),
  ).toBeDisabled();
  await expect.poll(() => posts).toBe(1);
  release();
  await expect(
    page.getByRole("status").filter({ hasText: "please retry" }),
  ).toBeVisible();
  await expect(page.getByLabel("Review context", { exact: true })).toHaveValue(
    formValues.context,
  );
  await page
    .getByRole("button", { name: "Create demo request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/practicum\/[0-9a-f-]{36}\/$/);
  expect(posts).toBe(2);
});
test("cookie flags, rotation, logout and replay; missing and forged cookies cannot open private pages", async ({
  page,
  context,
}) => {
  await page.goto("/upload/practicum/new/");
  await expect(page).toHaveURL(/\/demo-sign-in\/$/);
  let attributes:
    | {
        httpOnly: boolean;
        sameSite: boolean;
        path: boolean;
        lifetime: boolean;
        secure: boolean;
      }
    | undefined;
  page.on("response", async (response) => {
    if (response.request().method() !== "POST") return;
    const header = (await response.allHeaders())["set-cookie"] ?? "";
    if (!header.includes(cookieName + "=") || header.includes("Max-Age=0"))
      return;
    attributes = {
      httpOnly: /HttpOnly/i.test(header),
      sameSite: /SameSite=lax/i.test(header),
      path: /Path=\//.test(header),
      lifetime: /Max-Age=28800/.test(header),
      secure: /;\s*Secure/i.test(header),
    };
  });
  await signIn(page);
  const first = (await context.cookies()).find(
    (cookie) => cookie.name === cookieName,
  )!;
  expect(Boolean(first)).toBe(true);
  expect(first.httpOnly).toBe(true);
  expect(first.sameSite).toBe("Lax");
  expect(first.path).toBe("/");
  expect(first.secure).toBe(process.env.PLAYWRIGHT_DEV !== "1");
  expect(first.expires - Date.now() / 1000).toBeGreaterThan(28700);
  expect(
    await page.evaluate(() => document.cookie.includes("private-session-demo")),
  ).toBe(false);
  await expect
    .poll(() => attributes)
    .toEqual({
      httpOnly: true,
      sameSite: true,
      path: true,
      lifetime: true,
      secure: process.env.PLAYWRIGHT_DEV !== "1",
    });
  await signIn(page);
  const second = (await context.cookies()).find(
    (cookie) => cookie.name === cookieName,
  )!;
  expect(second.value !== first.value).toBe(true);
  await context.addCookies([{ ...first }]);
  await page.goto("/upload/practicum/");
  await expect(page).toHaveURL(/\/demo-sign-in\/$/);
  await context.addCookies([{ ...second }]);
  await page.goto("/upload/practicum/");
  await page.getByRole("button", { name: "Log out of demo" }).click();
  await expect(page).toHaveURL(new URL("/", page.url()).href);
  expect(
    (await context.cookies()).some((cookie) => cookie.name === cookieName),
  ).toBe(false);
  await context.addCookies([{ ...second }]);
  await page.goto("/upload/practicum/new/");
  await expect(page).toHaveURL(/\/demo-sign-in\/$/);
  await context.addCookies([{ ...second, value: "forged" }]);
  await page.goto("/upload/practicum/");
  await expect(page).toHaveURL(/\/demo-sign-in\/$/);
});
test("forged session rejects a valid action and unknown detail IDs reveal no record", async ({
  page,
  context,
}) => {
  await signIn(page);
  const cookie = (await context.cookies()).find(
    (entry) => entry.name === cookieName,
  )!;
  await page.goto("/upload/practicum/not-an-id/");
  await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  await page.goto("/upload/practicum/00000000-0000-4000-8000-000000000000/");
  await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  await fillRequest(page, "Unauthorized " + crypto.randomUUID());
  await context.addCookies([{ ...cookie, value: "forged" }]);
  await page
    .getByRole("button", { name: "Create demo request", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Please sign in to the demo again" }),
  ).toBeVisible();
});
test("demo transmits only intended same-origin forms with no media reads or unrelated persistence", async ({
  page,
  context,
}) => {
  const violations: string[] = [];
  await page.addInitScript(() => {
    const fail = () => {
      throw new Error("Forbidden demo media/storage operation");
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
    if (url.hostname !== "localhost") violations.push("external request");
    if (!["GET", "HEAD"].includes(request.method())) {
      if (
        request.method() !== "POST" ||
        !["/demo-sign-in/", "/upload/practicum/new/"].includes(url.pathname) ||
        !request.headers()["next-action"] ||
        (request.postData() ?? "").includes("filename=")
      )
        violations.push("unexpected content transmission");
    }
  });
  await signIn(page);
  await fillRequest(page, "Privacy " + crypto.randomUUID());
  await page
    .getByRole("button", { name: "Create demo request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/practicum\/[0-9a-f-]{36}\/$/);
  expect(violations).toEqual([]);
  expect(
    (await context.cookies()).every((cookie) => cookie.name === cookieName),
  ).toBe(true);
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});
