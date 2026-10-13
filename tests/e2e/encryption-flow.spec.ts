import { expect, test, type Page } from "@playwright/test";
import { sampleAnalysis } from "../../lib/workflows/samples";

async function prepareDraft(page: Page) {
  await page
    .getByLabel("Meeting title", { exact: true })
    .fill("Synthetic review");
  await page.getByLabel("Context (optional)").fill("Review the prototype");
  await page.getByLabel(/I confirm participant consent/).check();
  await page
    .getByRole("button", { name: "Prepare setup", exact: true })
    .click();
}

async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("draft encryption is gated, keyboard accessible, fresh, and reset on changes", async ({
  page,
}) => {
  await page.goto("/live/");
  const action = page.getByRole("button", {
    name: "Encrypt and verify draft",
    exact: true,
  });
  await expect(action).toHaveCount(0);
  await page
    .getByRole("button", { name: "Prepare setup", exact: true })
    .click();
  await expect(action).toHaveCount(0);
  await prepareDraft(page);
  const panel = page.getByRole("region", { name: "Draft encryption demo" });
  await expect(panel.getByRole("status")).toHaveCount(0);
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(panel.getByRole("status")).toHaveText(
    "Demo verified — decrypted content matches the draft.",
  );
  await expect(page.getByLabel("Meeting title", { exact: true })).toHaveValue(
    "Synthetic review",
  );
  const id = panel.locator("dd").nth(0);
  await expect(id).not.toBeVisible();
  await panel.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(id).toHaveText(/^live-draft:/);
  await expect(panel.locator("dd").nth(2)).toHaveText(/^[0-9a-f]{24}$/);
  const oldId = await id.textContent();
  const oldCipher = await panel.locator("dd").nth(3).textContent();
  await expectNoOverflow(page);
  await action.click();
  await expect(panel.getByRole("status")).toContainText("Demo verified");
  await panel.locator("summary").click();
  await expect(id).not.toHaveText(oldId!);
  await expect(panel.locator("dd").nth(3)).not.toHaveText(oldCipher!);
  await page
    .getByRole("button", { name: "Prepare setup", exact: true })
    .click();
  await expect(panel.getByRole("status")).toHaveCount(0);
  await action.click();
  await expect(panel.getByRole("status")).toContainText("Demo verified");
  await page.getByLabel("Context (optional)").fill("Changed context");
  await expect(panel).toHaveCount(0);
  await page.reload();
  await expect(action).toHaveCount(0);
});

test("review encryption contains only sample data and is independent of media selection", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const inputs: string[] = [];
    Object.defineProperty(window, "__encryptedInputs", { value: inputs });
    const original = crypto.subtle.encrypt.bind(crypto.subtle);
    crypto.subtle.encrypt = (algorithm, key, data) => {
      inputs.push(new TextDecoder().decode(data));
      return original(algorithm, key, data);
    };
  });
  await page.goto("/upload/");
  const action = page.getByRole("button", {
    name: "Encrypt and verify sample review",
  });
  const panel = page.getByRole("region", {
    name: "Sample review encryption demo",
  });
  await expect(action).toHaveCount(0);
  await page.getByRole("button", { name: "Try sample analysis" }).click();
  await action.click();
  await expect(panel.getByRole("status")).toContainText("Demo verified");
  await panel.locator("summary").click();
  const id = await panel.locator("dd").first().textContent();
  await expectNoOverflow(page);
  await page
    .getByLabel("Audio or video recording", { exact: true })
    .setInputFiles({
      name: "unrelated-private-file.MP4",
      mimeType: "video/mp4",
      buffer: Buffer.from("not sample text"),
    });
  await expect(panel.locator("dd").first()).toHaveText(id!);
  await action.click();
  await expect(panel.getByRole("status")).toContainText("Demo verified");
  const inputs = await page.evaluate(
    () =>
      (window as unknown as { __encryptedInputs: string[] }).__encryptedInputs,
  );
  expect(inputs).toHaveLength(2);
  for (const input of inputs)
    expect(JSON.parse(input)).toEqual({
      kind: "sample-review",
      data: sampleAnalysis,
    });
  await page.getByRole("button", { name: "Remove file", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("Demo verified");
  await page.getByRole("button", { name: "Reset sample analysis" }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole("button", { name: "Try sample analysis" }).click();
  await expect(panel.getByRole("status")).toHaveCount(0);
  await page.reload();
  await expect(action).toHaveCount(0);
});

// Delay the real API in the test browser only; the product has no test switches.
for (const flow of ["draft", "review"] as const) {
  test(`${flow} ignores late success after reset and blocks duplicate operations`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const state = { started: 0, completed: 0, release: () => {} };
      Object.defineProperty(window, "__cryptoGate", { value: state });
      const gate = new Promise<void>((resolve) => {
        state.release = resolve;
      });
      const generate = crypto.subtle.generateKey.bind(crypto.subtle);
      Object.defineProperty(crypto.subtle, "generateKey", {
        value: async (...args: Parameters<typeof generate>) => {
          state.started += 1;
          await gate;
          return generate(...args);
        },
      });
      const decrypt = crypto.subtle.decrypt.bind(crypto.subtle);
      crypto.subtle.decrypt = async (...args) => {
        const result = await decrypt(...args);
        state.completed += 1;
        return result;
      };
    });
    await page.goto(flow === "draft" ? "/live/" : "/upload/");
    if (flow === "draft") await prepareDraft(page);
    else
      await page.getByRole("button", { name: "Try sample analysis" }).click();
    const panel = page.getByRole("region", {
      name:
        flow === "draft"
          ? "Draft encryption demo"
          : "Sample review encryption demo",
    });
    const action = panel.getByRole("button");
    await action.click();
    await expect(action).toBeDisabled();
    await expect(panel.getByRole("status")).toContainText("in progress");
    await action.evaluate((button: HTMLButtonElement) => button.click());
    if (flow === "draft") {
      // Re-preparing even unchanged values must invalidate an in-flight result.
      await page
        .getByRole("button", { name: "Prepare setup", exact: true })
        .click();
    } else {
      await page.getByRole("button", { name: "Reset sample analysis" }).click();
      await page.getByRole("button", { name: "Try sample analysis" }).click();
    }
    await page.evaluate(() =>
      (
        window as unknown as { __cryptoGate: { release(): void } }
      ).__cryptoGate.release(),
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __cryptoGate: { completed: number } })
              .__cryptoGate.completed,
        ),
      )
      .toBe(1);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { __cryptoGate: { started: number } })
            .__cryptoGate.started,
      ),
    ).toBe(1);
    await expect(panel.getByRole("status")).toHaveCount(0);
    await action.click();
    await expect(panel.getByRole("status")).toContainText("Demo verified");
  });
}

test("crypto failures show no successful result and allow retry", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let fail = true;
    const decrypt = crypto.subtle.decrypt.bind(crypto.subtle);
    crypto.subtle.decrypt = async (...args) => {
      if (fail) {
        fail = false;
        throw new Error("Injected authentication failure");
      }
      return decrypt(...args);
    };
  });
  await page.goto("/upload/");
  await page.getByRole("button", { name: "Try sample analysis" }).click();
  const panel = page.getByRole("region", {
    name: "Sample review encryption demo",
  });
  await panel.getByRole("button").click();
  await expect(panel.getByRole("alert")).toContainText("Verification failed");
  await expect(panel.locator("details")).toHaveCount(0);
  await expect(panel.getByRole("status")).toHaveCount(0);
  await panel.getByRole("button").click();
  await expect(panel.getByRole("status")).toContainText("Demo verified");
  await expect(panel.getByRole("alert")).toHaveCount(0);
});

for (const unavailable of ["subtle", "insecure-context"] as const) {
  test(`unavailable encryption (${unavailable}) has an actionable error`, async ({
    page,
  }) => {
    await page.addInitScript((reason) => {
      if (reason === "subtle")
        Object.defineProperty(crypto, "subtle", { value: undefined });
      else Object.defineProperty(window, "isSecureContext", { value: false });
    }, unavailable);
    await page.goto("/live/");
    await prepareDraft(page);
    const panel = page.getByRole("region", { name: "Draft encryption demo" });
    await panel.getByRole("button").click();
    await expect(panel.getByRole("alert")).toContainText("localhost or HTTPS");
    await expect(panel.getByRole("status")).toHaveCount(0);
    await expect(panel.locator("details")).toHaveCount(0);
  });
}
