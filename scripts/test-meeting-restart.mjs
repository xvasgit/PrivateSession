import { hashPassword } from "better-auth/crypto";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import pg from "pg";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });
const target = new URL(process.env.DATABASE_URL);
if (
  !["localhost", "127.0.0.1"].includes(target.hostname) ||
  target.pathname !== "/privatesession_dev"
)
  throw new Error(
    "Restart check requires the owned local development database.",
  );
const code = `RESTART-${randomUUID()}`;
const userId = randomUUID();
const email = `${userId}@example.invalid`;
const password = randomUUID();
const db = new pg.Client({
  connectionString: target.toString(),
  connectionTimeoutMillis: 5000,
});
let server;
let browser;
let connected = false;
let stage = "connect";
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "localhost", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://localhost:${port}`;

async function start() {
  server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "localhost",
      "--port",
      String(port),
    ],
    {
      cwd: root,
      windowsHide: true,
      stdio: "ignore",
      env: {
        ...process.env,
        BETTER_AUTH_URL: origin,
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  );
  let failed = false;
  server.on("error", () => {
    failed = true;
  });
  for (let i = 0; i < 100; i++) {
    if (failed || server.exitCode !== null)
      throw new Error("Owned restart-check server failed to start.");
    try {
      if (
        (
          await fetch(`${origin}/sign-in/`, {
            signal: AbortSignal.timeout(1000),
          })
        ).ok
      )
        return;
    } catch {
      /* Wait for our server only. */
    }
    await delay(200);
  }
  throw new Error("Owned restart-check server did not become ready.");
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const exit = once(server, "exit");
  server.kill(); // Only the process created above; never an existing user server.
  await exit;
  server = undefined;
}
try {
  await db.connect();
  connected = true;
  await db.query(
    'INSERT INTO "User" (id,name,email,"updatedAt","mustChangePassword") VALUES ($1,$2,$3,CURRENT_TIMESTAMP,false)',
    [userId, "Synthetic restart", email],
  );
  await db.query(
    'INSERT INTO "Account" (id,"userId","accountId","providerId",password,"updatedAt") VALUES ($1,$2,$2,$3,$4,CURRENT_TIMESTAMP)',
    [randomUUID(), userId, "credential", await hashPassword(password)],
  );
  stage = "first server startup";
  await start();
  browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  async function signIn() {
    await page.goto(`${origin}/sign-in/`);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(`${origin}/meetings/`);
  }
  stage = "first sign-in";
  await signIn();
  stage = "create meeting";
  await page.goto(`${origin}/meetings/new/`);
  await page.getByLabel("Session code", { exact: true }).fill(code);
  await page
    .getByLabel("Meeting title", { exact: true })
    .fill("Synthetic restart verification");
  await page
    .getByRole("button", { name: "Create meeting", exact: true })
    .click();
  await page.waitForURL(/\/meetings\/\d+\/$/);
  const detail = page.url();
  stage = "create transcript";
  const add = page.getByRole("form", { name: "Add segment", exact: true });
  await add.getByLabel("Sequence number").fill("1");
  await add
    .getByLabel("Transcript text")
    .fill("Synthetic text survives restart.");
  await add.getByRole("button").click();
  await page.getByRole("heading", { name: "Segment 1", exact: true }).waitFor();
  stage = "save review";
  await page.getByText("Edit review", { exact: true }).click();
  const review = page.getByRole("form", { name: "Save review", exact: true });
  await review
    .getByLabel("Summary", { exact: true })
    .fill("Synthetic review survives restart.");
  await review.getByRole("button").click();
  await review.getByText("Review saved.", { exact: true }).waitFor();
  const oldCookie = (await context.cookies()).find((c) =>
    c.name.endsWith("private-session.session_token"),
  );
  assert(oldCookie);
  stage = "restart server";
  await stop();
  await start();
  stage = "verify durable session";
  await page.goto(detail);
  assert.equal(page.url(), detail);
  stage = "verify persisted text";
  await page
    .locator("p")
    .filter({ hasText: /^Synthetic text survives restart\.$/ })
    .waitFor();
  assert.equal(
    await page.locator("#summary p").textContent(),
    "Synthetic review survives restart.",
  );
  stage = "logout and restart replay rejection";
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL(`${origin}/`);
  await stop();
  await start();
  await context.addCookies([oldCookie]);
  await page.goto(detail);
  await page.waitForURL(`${origin}/sign-in/`);
  console.log(
    "PASS restart: session, transcript and review survive restart; revoked cookie remains rejected after another restart.",
  );
} catch (error) {
  console.error(
    `Restart check failed at ${stage} (${error?.name ?? "unknown"}). No credentials, cookies or record contents are logged.`,
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stop();
  if (connected) {
    try {
      await db.query("BEGIN");
      await db.query(
        'DELETE FROM "TranscriptSegment" WHERE "sessionId" IN (SELECT id FROM "MeetingSession" WHERE "sessionCode"=$1 AND "ownerId"=$2)',
        [code, userId],
      );
      await db.query(
        'DELETE FROM "MeetingSession" WHERE "sessionCode"=$1 AND "ownerId"=$2',
        [code, userId],
      );
      await db.query('DELETE FROM "User" WHERE id=$1', [userId]);
      await db.query("COMMIT");
    } catch {
      await db.query("ROLLBACK");
      console.error("Restart-check fixture cleanup failed.");
      process.exitCode = 1;
    }
  }
  await db.end();
}
