import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { localDatabaseUrl } from "./database/lab-config";

const globals = globalThis as typeof globalThis & {
  privateSessionDatabase?: PrismaClient;
};

/** Lazy initialization keeps unrelated public pages independent of lab secrets. */
export function getPrisma(): PrismaClient {
  return (globals.privateSessionDatabase ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: localDatabaseUrl(process.env.DATABASE_URL),
      connectionTimeoutMillis: 5000,
    }),
    log: [],
    errorFormat: "minimal",
  }));
}
