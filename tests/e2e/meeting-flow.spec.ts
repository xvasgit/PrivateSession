import { expect, test } from "@playwright/test";

test("navigate the three routes with active indicators and no overflow", async ({
  page,
}) => {
  for (const [path, label] of [
    ["/", "Overview"],
    ["/live/", "Live Transcription"],
    ["/upload/", "Upload & Review"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Live Transcription", exact: true })
    .click();
  await expect(page).toHaveURL(/\/live\/$/);
  for (const path of ["/sessions/", "/sessions/new/"])
    expect((await page.request.get(path)).status()).toBe(404);
});

test("overview shows accurate feature status and no saved history", async ({
  page,
}) => {
  await page.goto("/");
  for (const title of ["Live Transcription", "Upload & Review"]) {
    const card = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(card.getByText("In progress", { exact: true })).toBeVisible();
  }
  const workspace = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Contextual Workspaces" }),
  });
  await expect(workspace.getByText("Upcoming", { exact: true })).toBeVisible();
  await expect(workspace.getByRole("link")).toHaveCount(0);
  await expect(
    page.getByText(/logistics|job.finding|resume|sample meetings/i),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Sessions", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Explore upload & review" }).click();
  await expect(page).toHaveURL(/\/upload\/$/);
});

test("mode switching restores defaults and restricts recording sources", async ({
  page,
}) => {
  await page.goto("/live/");
  for (const name of ["Microphone", "System audio", "Screen snapshots"])
    await expect(page.getByLabel(name, { exact: true })).toBeChecked();
  await page.getByLabel("Screen snapshots", { exact: true }).uncheck();
  await page.getByLabel("Live Recording", { exact: true }).check();
  await expect(
    page.getByLabel("Microphone", { exact: false }).first(),
  ).toBeChecked();
  await expect(
    page.getByLabel("Microphone", { exact: false }).first(),
  ).toBeDisabled();
  await expect(page.getByLabel(/System audio/)).not.toBeChecked();
  await expect(page.getByLabel(/System audio/)).toBeDisabled();
  await expect(
    page.getByLabel("Screen snapshots", { exact: true }),
  ).not.toBeChecked();
  await page.getByLabel("Screen snapshots", { exact: true }).check();
  await page.getByLabel("Online Meeting", { exact: true }).check();
  for (const name of ["Microphone", "System audio", "Screen snapshots"])
    await expect(page.getByLabel(name, { exact: true })).toBeChecked();
});

test("validate setup, require audio and consent, and clear stale preparation", async ({
  page,
}) => {
  await page.goto("/live/");
  await page.getByRole("button", { name: "Prepare setup" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Please correct" }),
  ).toBeVisible();
  await expect(
    page.getByText("Enter a meeting title between 3 and 80 characters."),
  ).toBeVisible();
  await expect(
    page.getByText("Confirm participant consent before preparing setup."),
  ).toBeVisible();
  await page
    .getByLabel("Meeting title", { exact: true })
    .fill("Synthetic review");
  await page.getByLabel(/I confirm participant consent/).check();
  await page.getByLabel("Microphone", { exact: true }).uncheck();
  await page.getByLabel("System audio", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Prepare setup" }).click();
  await expect(
    page.getByText(/Select at least one audio source/),
  ).toBeVisible();
  await page.getByLabel("Microphone", { exact: true }).check();
  await page.getByRole("button", { name: "Prepare setup" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Setup prepared — capture is not available yet",
  );
  await expect(page.getByRole("status")).toContainText(
    "Microphone, Screen snapshots",
  );
  await page.getByLabel("Context (optional)").fill("Synthetic context");
  await expect(
    page.getByText("Setup prepared — capture is not available yet"),
  ).toHaveCount(0);
});

test("sample transcript plays, pauses, resumes, stops, and resets", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/live/");
  await expect(page.getByText(/No transcript yet/)).toBeVisible();
  await page.getByRole("button", { name: "Try sample transcript" }).click();
  const entries = page
    .getByRole("list", { name: "Synthetic transcript" })
    .getByRole("listitem");
  await expect(entries).toHaveCount(1);
  await page.getByRole("button", { name: "Pause demo" }).click();
  await page.clock.runFor(4000);
  await expect(entries).toHaveCount(1);
  await expect(page.getByRole("status")).toContainText("Demo paused");
  await page.getByRole("button", { name: "Resume demo" }).click();
  await page.clock.runFor(5000);
  await expect(entries).toHaveCount(4);
  await expect(entries.filter({ hasText: "Screen context" })).toHaveCount(1);
  await page.getByRole("button", { name: "Stop demo" }).click();
  await expect(page.getByRole("status")).toContainText("Demo stopped");
  await page.clock.runFor(3000);
  await expect(entries).toHaveCount(4);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByText(/No transcript yet/)).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Synthetic transcript" }),
  ).toHaveCount(0);
});

test("file validation and analysis stay independent", async ({ page }) => {
  await page.goto("/upload/");
  const picker = page.getByLabel("Audio or video recording", { exact: true });
  await expect(page.getByText(/No analysis yet/)).toBeVisible();
  await picker.setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("synthetic"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Choose an MP3" }),
  ).toBeVisible();
  await picker.setInputFiles({
    name: "empty.wav",
    mimeType: "audio/wav",
    buffer: Buffer.alloc(0),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "empty" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try sample analysis" }).click();
  await expect(
    page.getByRole("heading", { name: "Potential missed details" }),
  ).toBeVisible();
  await expect(page.getByText(/Missing owner:/)).toBeVisible();
  for (const [name, category] of [
    ["chosen.MP3", "Audio"],
    ["other.MOV", "Video"],
  ]) {
    await picker.setInputFiles({
      name,
      mimeType: "application/octet-stream",
      buffer: Buffer.from("synthetic"),
    });
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(
      page.getByText(`${category} · 9 B`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Selection ready" }),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Demo analysis" }),
    ).toContainText("unrelated to your file");
  }
  await page.getByRole("button", { name: "Remove file" }).click();
  await expect(picker).toHaveValue("");
  await expect(picker).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Summary", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset sample analysis" }).click();
  await expect(page.getByText(/No analysis yet/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("No recording selected.")).toBeVisible();
});

test("Sign In dialog supports keyboard dismissal and focus return", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Sign In", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Accounts are upcoming" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  const close = dialog.getByRole("button", { name: "Close" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await close.click();
  await expect(trigger).toBeFocused();
});

test("flows never capture, read media, send content, or persist state", async ({
  page,
}) => {
  const outbound: string[] = [];
  page.on("request", (request) => {
    if (
      // Static navigation may probe route availability with a bodyless HEAD.
      !["GET", "HEAD"].includes(request.method()) ||
      !/^(127\.0\.0\.1|localhost)$/.test(new URL(request.url()).hostname)
    )
      outbound.push(request.url());
  });
  await page.addInitScript(() => {
    const calls: string[] = [];
    Object.defineProperty(window, "__previewCalls", { value: calls });
    function guard(target: object, name: string) {
      Object.defineProperty(target, name, {
        configurable: true,
        value: () => {
          calls.push(name);
          throw new Error(`Unexpected ${name}`);
        },
      });
    }
    if (navigator.mediaDevices)
      for (const name of [
        "getUserMedia",
        "getDisplayMedia",
        "enumerateDevices",
      ])
        guard(navigator.mediaDevices, name);
    for (const name of ["text", "arrayBuffer", "stream"])
      guard(Blob.prototype, name);
    for (const name of [
      "readAsText",
      "readAsDataURL",
      "readAsArrayBuffer",
      "readAsBinaryString",
    ])
      guard(FileReader.prototype, name);
    guard(Storage.prototype, "setItem");
    guard(IDBFactory.prototype, "open");
  });
  const calls = () =>
    page.evaluate(
      () => (window as unknown as { __previewCalls: string[] }).__previewCalls,
    );
  await page.goto("/live/");
  await page
    .getByLabel("Meeting title", { exact: true })
    .fill("Synthetic meeting");
  await page.getByLabel(/I confirm participant consent/).check();
  await page.getByRole("button", { name: "Prepare setup" }).click();
  await page.getByRole("button", { name: "Try sample transcript" }).click();
  await page.getByRole("button", { name: "Stop demo" }).click();
  await page
    .getByRole("button", { name: "Encrypt and verify draft", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Draft encryption demo" })
      .getByRole("status"),
  ).toContainText("Demo verified");
  expect(await calls()).toEqual([]);
  await page.reload();
  await expect(page.getByLabel("Meeting title", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByText(/No transcript yet/)).toBeVisible();
  await page.goto("/upload/");
  await page
    .getByLabel("Audio or video recording", { exact: true })
    .setInputFiles({
      name: "synthetic.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("synthetic"),
    });
  await page.getByRole("button", { name: "Try sample analysis" }).click();
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Encrypt and verify sample review" })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Sample review encryption demo" })
      .getByRole("status"),
  ).toContainText("Demo verified");
  expect(await calls()).toEqual([]);
  expect(outbound).toEqual([]);
});
