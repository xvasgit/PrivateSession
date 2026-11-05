/** This database foundation targets the owned local lab, not a hosted database. */
export function localDatabaseUrl(value: string | undefined): string {
  let url: URL;
  try {
    url = new URL(value ?? "");
  } catch {
    throw new Error("A valid local database connection is required.");
  }
  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !url.username ||
    !url.password ||
    ["", "/", "/postgres", "/template0", "/template1"].includes(
      decodeURIComponent(url.pathname),
    ) ||
    [...url.searchParams.keys()].some((name) => name !== "schema") ||
    (url.searchParams.has("schema") &&
      url.searchParams.get("schema") !== "public")
  )
    throw new Error("Use a dedicated PostgreSQL database on loopback.");
  return url.toString();
}
