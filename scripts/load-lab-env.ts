import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// Existing process variables take precedence, then .env.local, then .env.
// Seed/CLI entry points need explicit loading outside the Next.js runtime.
config({
  path: fileURLToPath(new URL("../.env.local", import.meta.url)),
  quiet: true,
});
config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
