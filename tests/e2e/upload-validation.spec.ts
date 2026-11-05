import { expect, test } from "@playwright/test";

const recording = {
  name: "synthetic.MP3",
  mimeType: "audio/mp3",
  buffer: Buffer.from("PRIVATE_MEDIA_SENTINEL"),
};

test("validates metadata only on explicit submission and preserves independent samples", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.postData() ?? "");
  });
  await page.goto("/upload/");
  const button = page.getByRole("button", {
    name: "Validate selection",
    exact: true,
  });
  await expect(button).toBeDisabled();
  await page
    .getByLabel("Audio or video recording", { exact: true })
    .setInputFiles(recording);
  await page.getByRole("button", { name: "Try sample analysis" }).click();
  expect(posts).toEqual([]);
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/^Selection validated/)).toBeVisible();
  expect(posts).toHaveLength(1);
  expect(posts[0]).toContain(recording.name);
  expect(posts[0]).not.toContain("PRIVATE_MEDIA_SENTINEL");
  expect(posts[0]).not.toContain("filename=");
  await expect(
    page.getByRole("heading", { name: "Summary", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Remove file", exact: true }).click();
  await expect(page.getByText(/^Selection validated/)).toHaveCount(0);
  await expect(button).toBeDisabled();
  await page.reload();
  await expect(page.getByText("No recording selected.")).toBeVisible();
});

test("server rejects tampered metadata with associated field errors", async ({
  page,
}) => {
  await page.route("**/upload/", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const original = route.request().postData()!;
    const tampered = original.replace(/(name="[^"]*size"\r\n\r\n)\d+/, "$10");
    expect(tampered).not.toBe(original);
    await route.continue({ postData: tampered });
  });
  await page.goto("/upload/");
  const picker = page.getByLabel("Audio or video recording", { exact: true });
  await picker.setInputFiles(recording);
  await page.getByRole("button", { name: "Validate selection" }).click();
  await expect(page.locator("#file-error")).toContainText("empty");
  await expect(picker).toHaveAttribute("aria-invalid", "true");
  await expect(picker).toHaveAttribute("aria-describedby", /file-error/);
  await expect(page.getByText(/^Selection validated/)).toHaveCount(0);
});

test("network failure retains the selection and allows retry", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/upload/", async (route) => {
    if (route.request().method() === "POST" && fail) {
      fail = false;
      return route.fulfill({ status: 503, body: "Unavailable" });
    }
    await route.continue();
  });
  await page.goto("/upload/");
  await page
    .getByLabel("Audio or video recording", { exact: true })
    .setInputFiles(recording);
  const button = page.getByRole("button", { name: "Validate selection" });
  await button.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Could not validate" }),
  ).toBeVisible();
  await expect(page.getByText(recording.name, { exact: true })).toBeVisible();
  await button.click();
  await expect(page.getByText(/^Selection validated/)).toBeVisible();
});

for (const change of ["replace", "remove"] as const) {
  test(`pending validation blocks duplicates and ignores a late result after ${change}`, async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requests = 0;
    await page.route("**/upload/", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      requests++;
      await gate;
      await route.continue();
    });
    await page.goto("/upload/");
    const picker = page.getByLabel("Audio or video recording", { exact: true });
    await picker.setInputFiles(recording);
    await page.getByRole("button", { name: "Validate selection" }).click();
    await expect(
      page.getByRole("button", { name: "Validating…" }),
    ).toBeDisabled();
    await expect.poll(() => requests).toBe(1);
    if (change === "replace")
      await picker.setInputFiles({ ...recording, name: "replacement.wav" });
    else
      await page
        .getByRole("button", { name: "Remove file", exact: true })
        .click();
    release();
    await expect(page.getByRole("button", { name: "Validating…" })).toHaveCount(
      0,
    );
    await expect(page.getByText(/^Selection validated/)).toHaveCount(0);
    expect(requests).toBe(1);
    if (change === "replace") {
      await page.getByRole("button", { name: "Validate selection" }).click();
      await expect(page.getByText(/^Selection validated/)).toBeVisible();
    }
  });
}
