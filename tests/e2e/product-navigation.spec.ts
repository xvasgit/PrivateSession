import { expect, test } from "@playwright/test";

test("overview preserves feature descriptions and leads to the meeting workflow", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link")).toHaveText([
    "Overview",
    "Meetings",
    "Upload & Review",
  ]);
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  for (const heading of [
    "Live Transcription",
    "Upload & Review",
    "Contextual Workspaces",
  ])
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  await expect(page.getByText("In progress", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Upcoming", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in\/$/);
  await expect(
    page.getByText(/Only you can access your meetings through this app/),
  ).toBeVisible();
});

test("public pages have accessible layout without live or analysis demos", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fail = () => {
      throw Error("Device capture or file content access is forbidden");
    };
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = fail;
      navigator.mediaDevices.getDisplayMedia = fail;
    }
    Blob.prototype.arrayBuffer = fail;
    Blob.prototype.text = fail;
    FileReader.prototype.readAsArrayBuffer = fail;
  });
  for (const path of ["/", "/live/", "/upload/", "/about/", "/sign-in/"]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: /Try sample|Encrypt|Prepare setup/ }),
    ).toHaveCount(0);
  }
  await page.goto("/upload/");
  const manual = page.getByRole("link", {
    name: "Enter a transcript manually",
  });
  await manual.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/sign-in\/$/);
});

test("retired demo routes return not found without redirects", async ({
  page,
}) => {
  for (const path of [
    "/upload/practicum/",
    "/upload/practicum/new/",
    "/upload/samples/",
    "/upload/samples/obsolete/",
    "/demo-sign-in/",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /not found/i }),
    ).toBeVisible();
  }
});
