import { expect, test, type Page } from "@playwright/test";

async function expectLayout(page: Page) {
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("about and sample reviews are reachable with client navigation", async ({
  page,
}) => {
  await page.goto("/about/");
  await expect(
    page.getByRole("heading", { level: 1, name: "About PrivateSession" }),
  ).toBeVisible();
  await expectLayout(page);
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    navigation.getByRole("link", { name: "About", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  let documents = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "document") documents++;
  });
  await navigation
    .getByRole("link", { name: "Upload & Review", exact: true })
    .click();
  const browse = page.getByRole("link", { name: "Browse review examples" });
  await browse.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/upload\/samples\/$/);
  await expect(
    page.getByRole("heading", { name: "Review examples", exact: true }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Upload & Review", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("link", { name: "Prototype design review", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Study planning review", exact: true }),
  ).toBeVisible();
  await expectLayout(page);
  expect(documents).toBe(0);
  await page.reload();
  expect(documents).toBe(1);
});

test("layout notes persist while template notes reset and reload clears both", async ({
  page,
}) => {
  await page.goto("/upload/samples/");
  const workspace = page.getByLabel("Review workspace note", { exact: true });
  const current = page.getByLabel("Current review note", { exact: true });
  await workspace.fill("Synthetic workspace note");
  await current.fill("Synthetic list note");
  await page
    .getByRole("link", { name: "Prototype design review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Prototype design review" }),
  ).toBeVisible();
  await expect(workspace).toHaveValue("Synthetic workspace note");
  await expect(current).toHaveValue("");
  await expectLayout(page);
  await current.fill("Synthetic first review note");
  await page
    .getByRole("link", { name: "Study planning review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Study planning review" }),
  ).toBeVisible();
  await expect(workspace).toHaveValue("Synthetic workspace note");
  await expect(current).toHaveValue("");
  await current.fill("Synthetic second review note");
  await page
    .getByRole("link", { name: "Back to review examples", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Review examples" }),
  ).toBeVisible();
  await expect(workspace).toHaveValue("Synthetic workspace note");
  await expect(current).toHaveValue("");
  await current.fill("Synthetic final note");
  await page.reload();
  await expect(workspace).toHaveValue("");
  await expect(current).toHaveValue("");
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});

test("detail parameters reject malformed, missing and unsafe identifiers", async ({
  page,
}) => {
  for (const [id, title] of [
    ["1", "Prototype design review"],
    ["2", "Study planning review"],
  ]) {
    const response = await page.goto(`/upload/samples/${id}/`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    await expectLayout(page);
  }
  for (const id of ["abc", "0", "03", "999", "9007199254740992"]) {
    const response = await page.goto(`/upload/samples/${id}/`);
    expect([200, 404]).toContain(response?.status());
    await expect(
      page.getByRole("heading", { level: 1, name: "Review example not found" }),
    ).toBeVisible();
    await expect(
      page.locator('meta[name="robots"][content*="noindex"]').first(),
    ).toBeAttached();
    await expect(page.getByLabel("Review examples panel")).toBeVisible();
  }
  await page
    .getByRole("link", { name: "Back to review examples", exact: true })
    .click();
  await expect(page).toHaveURL(/\/upload\/samples\/$/);
});

test("unmatched routes use the global fallback without activating a partial prefix", async ({
  page,
}) => {
  for (const path of ["/tidak-ada/", "/upload-other/", "/sessions/"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .locator('[aria-current="page"]'),
    ).toHaveCount(0);
    await expectLayout(page);
  }
});
