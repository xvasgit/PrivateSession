import { describe, expect, it } from "vitest";
import { localDatabaseUrl } from "../../lib/database/lab-config";

describe("local database boundary", () => {
  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "accepts dedicated loopback databases",
    (host) => {
      const url = `postgresql://synthetic:synthetic@${host}:5432/lab?schema=public`;
      expect(new URL(localDatabaseUrl(url)).hostname).toBe(host);
    },
  );

  it.each([
    undefined,
    "invalid",
    "https://synthetic:synthetic@localhost/lab",
    "postgresql://synthetic:synthetic@example.invalid/lab",
    "postgresql://localhost/lab",
    "postgresql://synthetic:synthetic@localhost/postgres",
    "postgresql://synthetic:synthetic@localhost/template0",
    "postgresql://synthetic:synthetic@localhost/template1",
    "postgresql://synthetic:synthetic@localhost/",
    "postgresql://synthetic:synthetic@localhost/%70ostgres",
    "postgresql://synthetic:synthetic@localhost/lab?host=example.invalid",
    "postgresql://synthetic:synthetic@localhost/lab?schema=other",
  ])(
    "rejects remote, missing, or system-database configuration without echoing credentials",
    (value) => {
      expect(() => localDatabaseUrl(value)).toThrow();
      try {
        localDatabaseUrl(value);
      } catch (error) {
        expect(String(error)).not.toContain("synthetic:synthetic");
      }
    },
  );
});
