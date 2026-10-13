import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";

const origin = "http://127.0.0.1:3000";
const routes = [
  { name: "overview", path: "/" },
  { name: "live", path: "/live/" },
  { name: "upload", path: "/upload/" },
];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

// Audit only the built prototype served by npm start, not an external target.
const response = await fetch(origin);
if (!response.ok) throw new Error("Start the built app with npm start first.");
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const browser = await chromium.launch({
  args: [`--remote-debugging-port=${port}`],
});
const report = {
  generatedAt: new Date().toISOString(),
  runtime: process.version,
  browser: browser.version(),
  environment: "Windows local production static export, loopback HTTP",
  screenshots: [],
  audits: [],
};

try {
  await mkdir("docs/evidence/viewports", { recursive: true });
  await mkdir("docs/evidence/lighthouse", { recursive: true });
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${origin}${route.path}`, { waitUntil: "networkidle" });
      const path = `docs/evidence/viewports/${route.name}-${viewport.name}.png`;
      await page.screenshot({ path, fullPage: true });
      report.screenshots.push({ route: route.path, viewport, path });
    }
    await context.close();
  }
  for (const route of routes) {
    const result = await lighthouse(`${origin}${route.path}`, {
      port,
      onlyCategories: ["accessibility"],
      output: "json",
      logLevel: "error",
      formFactor: "desktop",
      screenEmulation: {
        mobile: false,
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
        disabled: false,
      },
    });
    if (!result || result.lhr.runtimeError)
      throw new Error(`Audit failed for ${route.path}`);
    const path = `docs/evidence/lighthouse/${route.name}-desktop.json`;
    await writeFile(path, result.report);
    const score = result.lhr.categories.accessibility.score * 100;
    report.audits.push({
      route: route.path,
      score,
      path,
      lighthouseVersion: result.lhr.lighthouseVersion,
      settings: result.lhr.configSettings,
    });
    console.log(`${route.path}: Lighthouse Accessibility ${score}`);
  }
  await writeFile(
    "docs/evidence/ui-audit.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  if (report.audits.some((audit) => audit.score < 85))
    throw new Error("A page is below the Tugas 1 accessibility threshold.");
} finally {
  await browser.close();
}
