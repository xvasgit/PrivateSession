import "./scripts/load-lab-env";
import { defineConfig } from "prisma/config";
import { localDatabaseUrl } from "./lib/database/lab-config";

const url = process.env.DATABASE_URL
  ? localDatabaseUrl(process.env.DATABASE_URL)
  : undefined;
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL
  ? localDatabaseUrl(process.env.SHADOW_DATABASE_URL)
  : undefined;

if (process.argv.includes("migrate") && (!url || !shadowDatabaseUrl))
  throw new Error(
    "Configure both local development and shadow database URLs before migrations.",
  );

if (
  url &&
  shadowDatabaseUrl &&
  decodeURIComponent(new URL(url).pathname) ===
    decodeURIComponent(new URL(shadowDatabaseUrl).pathname)
)
  throw new Error(
    "Development and shadow databases must have different names.",
  );

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url, shadowDatabaseUrl },
});
