import "server-only";
import { randomUUID } from "node:crypto";
import type { ReviewRequestInput } from "./schema";

export const SESSION_SECONDS = 8 * 60 * 60;
export type DemoSession = { owner: string; expiresAt: number };
export type ReviewRequest = ReviewRequestInput & {
  id: string;
  owner: string;
  createdAt: string;
};

// Single-process lab only. Never use this store for real user data or multi-instance deployment.
export class PracticumStore {
  private sessions = new Map<string, DemoSession>();
  private records = new Map<string, ReviewRequest>();

  createSession(owner: string, previous?: string): string {
    if (previous) this.sessions.delete(previous);
    const now = Date.now();
    for (const [id, session] of this.sessions)
      if (session.expiresAt <= now) this.sessions.delete(id);
    const id = randomUUID();
    this.sessions.set(id, { owner, expiresAt: now + SESSION_SECONDS * 1000 });
    return id;
  }
  readSession(id?: string): DemoSession | null {
    const session = id ? this.sessions.get(id) : undefined;
    if (!session || session.expiresAt <= Date.now()) {
      if (id) this.sessions.delete(id);
      return null;
    }
    return { ...session };
  }
  revokeSession(id?: string) {
    if (id) this.sessions.delete(id);
  }
  createRecord(owner: string, input: ReviewRequestInput): ReviewRequest | null {
    // Check and insert synchronously: no await between semantic validation and mutation.
    if (
      [...this.records.values()].some(
        (r) =>
          r.owner === owner &&
          r.title.toLowerCase() === input.title.toLowerCase(),
      )
    )
      return null;
    const record = {
      ...input,
      owner,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.records.set(record.id, record);
    return { ...record };
  }
  listRecords(owner: string): ReviewRequest[] {
    return [...this.records.values()]
      .filter((r) => r.owner === owner)
      .map((r) => ({ ...r }))
      .reverse();
  }
  findRecord(owner: string, id: string): ReviewRequest | undefined {
    const record = this.records.get(id);
    return record?.owner === owner ? { ...record } : undefined;
  }
}
const globals = globalThis as typeof globalThis & {
  privateSessionPracticum?: PracticumStore;
};
export const practicumStore = (globals.privateSessionPracticum ??=
  new PracticumStore());
