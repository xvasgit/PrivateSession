import "server-only";
import { getPrisma } from "../prisma";
import { createAuthentication } from "./core";
let instance: ReturnType<typeof createAuthentication> | undefined;
export function getAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const address = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !address)
    throw new Error("Authentication is not configured.");
  const url = new URL(address);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Invalid authentication origin.");
  return (instance ??= createAuthentication(getPrisma(), secret, url.origin));
}
