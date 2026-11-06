import "./load-lab-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { localDatabaseUrl } from "../lib/database/lab-config";
import {
  fixtureUser,
  fixtureActor,
  removeFixtureUser,
} from "../tests/support/auth-fixtures";
import { mutateMeeting } from "../lib/meetings/repository";
import { verifyActor } from "../lib/auth/authorization";
import {
  createMember,
  setMemberStatus,
  updateProfile,
} from "../lib/auth/accounts";
import { createAuthentication } from "../lib/auth/core";
import {
  importTranscriptKey,
  encryptTranscript,
} from "../lib/crypto/transcript-encryption";
import { encryptReview, decryptReview } from "../lib/crypto/review-encryption";

async function main() {
  const url = new URL(localDatabaseUrl(process.env.DATABASE_URL));
  url.pathname = "/privatesession_auth_rehearsal";
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url.toString(),
      connectionTimeoutMillis: 5000,
    }),
    log: [],
  });
  const users: string[] = [];
  const key = await importTranscriptKey(process.env.DATA_ENCRYPTION_KEY);
  const seal = (
    text: string,
    identity: { sessionId: number; sequence: number },
  ) => encryptTranscript(text, key, identity);
  const crypto = {
    seal: (review: Parameters<typeof encryptReview>[0], id: number) =>
      encryptReview(review, key, id),
    open: (row: Parameters<typeof decryptReview>[0], id: number) =>
      decryptReview(row, key, id),
  };
  let positive = 0,
    negative = 0;
  const pair = async (
    label: string,
    yes: () => Promise<unknown>,
    no: () => Promise<unknown>,
  ) => {
    await yes();
    positive++;
    const before = await db.meetingSession.findMany({
      orderBy: { id: "asc" },
      include: { segments: { orderBy: { id: "asc" } } },
    });
    await assert.rejects(no);
    assert.deepEqual(
      await db.meetingSession.findMany({
        orderBy: { id: "asc" },
        include: { segments: { orderBy: { id: "asc" } } },
      }),
      before,
    );
    negative++;
    console.log(`PASS access pair ${positive}: ${label}`);
  };
  try {
    const a = await fixtureUser(db);
    users.push(a.id);
    const b = await fixtureUser(db);
    users.push(b.id);
    const admin = await fixtureUser(db, "ADMIN");
    users.push(admin.id);
    const aa = await fixtureActor(db, a.id),
      bb = await fixtureActor(db, b.id),
      ad = await fixtureActor(db, admin.id);
    const code = `ACCESS-${randomUUID()}`;
    const path = await mutateMeeting(db, aa, seal, {
      operation: "createMeeting",
      sessionCode: code,
      title: "Synthetic private meeting",
    });
    const id = Number(path.split("/")[2]);
    const snapshot = () =>
      db.meetingSession.findUniqueOrThrow({
        where: { id },
        include: { segments: true },
      });
    await pair(
      "member own read / other member read",
      () =>
        db.meetingSession.findUniqueOrThrow({ where: { id, ownerId: a.id } }),
      () =>
        db.meetingSession.findUniqueOrThrow({ where: { id, ownerId: b.id } }),
    );
    await pair(
      "own meeting edit / cross-owner edit",
      () =>
        mutateMeeting(db, aa, seal, {
          operation: "updateMeeting",
          id,
          sessionCode: code,
          title: "Updated synthetic",
        }),
      () =>
        mutateMeeting(db, bb, seal, {
          operation: "updateMeeting",
          id,
          sessionCode: code,
          title: "Forbidden",
        }),
    );
    await pair(
      "own segment create / foreign parent create",
      () =>
        mutateMeeting(db, aa, seal, {
          operation: "createSegment",
          sessionId: id,
          sequence: 1,
          content: "Synthetic protected content",
        }),
      () =>
        mutateMeeting(db, bb, seal, {
          operation: "createSegment",
          sessionId: id,
          sequence: 2,
          content: "Forbidden",
        }),
    );
    const segment = (await snapshot()).segments[0];
    await pair(
      "own segment edit / cross-owner edit",
      () =>
        mutateMeeting(db, aa, seal, {
          operation: "updateSegment",
          id: segment.id,
          sessionId: id,
          content: "Updated protected content",
        }),
      () =>
        mutateMeeting(db, bb, seal, {
          operation: "updateSegment",
          id: segment.id,
          sessionId: id,
          content: "Forbidden",
        }),
    );
    await pair(
      "own review save / administrator foreign review",
      () =>
        mutateMeeting(
          db,
          aa,
          seal,
          {
            operation: "saveReview",
            id,
            summary: "Manual synthetic summary",
            insights: "",
            followUps: "",
          },
          crypto,
        ),
      () =>
        mutateMeeting(
          db,
          ad,
          seal,
          {
            operation: "saveReview",
            id,
            summary: "Forbidden",
            insights: "",
            followUps: "",
          },
          crypto,
        ),
    );
    await pair(
      "administrator own library / foreign private detail",
      async () => {
        const rows = await db.meetingSession.findMany({
          where: { ownerId: admin.id },
        });
        assert.equal(rows.length, 0);
      },
      () =>
        db.meetingSession.findUniqueOrThrow({
          where: { id, ownerId: admin.id },
        }),
    );
    await pair(
      "own profile edit / profile identity injection",
      () => updateProfile(db, aa, { name: "Updated member" }),
      () =>
        updateProfile(db, aa, {
          name: "Forbidden",
          userId: b.id,
          role: "ADMIN",
        }),
    );
    await pair(
      "administrator provisioning / member provisioning",
      async () => {
        const user = await createMember(db, ad, {
          name: "Synthetic new member",
          email: `${randomUUID()}@example.invalid`,
          password: randomUUID(),
        });
        users.push(user.id);
      },
      () =>
        createMember(db, aa, {
          name: "Forbidden",
          email: `${randomUUID()}@example.invalid`,
          password: randomUUID(),
        }),
    );
    await pair(
      "administrator status change / member status change",
      () => setMemberStatus(db, ad, { userId: b.id, status: "DISABLED" }),
      () => setMemberStatus(db, aa, { userId: b.id, status: "ACTIVE" }),
    );
    await pair(
      "active account access / disabled old session",
      () => db.$transaction((tx) => verifyActor(tx, aa)),
      () => db.$transaction((tx) => verifyActor(tx, bb)),
    );
    await pair(
      "same code across owners / duplicate within owner",
      () =>
        mutateMeeting(db, ad, seal, {
          operation: "createMeeting",
          sessionCode: code,
          title: "Administrator own meeting",
        }),
      () =>
        mutateMeeting(db, aa, seal, {
          operation: "createMeeting",
          sessionCode: code,
          title: "Duplicate",
        }),
    );
    await pair(
      "owner deletion / cross-owner bulk deletion",
      () =>
        mutateMeeting(db, aa, seal, {
          operation: "deleteSegment",
          sessionId: id,
          id: segment.id,
          confirmation: "on",
        }),
      () =>
        mutateMeeting(db, ad, seal, {
          operation: "deleteAll",
          id,
          confirmation: "on",
        }),
    );
    assert.equal(positive, negative);
    assert.equal(positive, 12);
    await db.user.update({
      where: { id: a.id },
      data: { mustChangePassword: true },
    });
    const origin = "http://localhost:3199";
    const auth = createAuthentication(db, randomUUID() + randomUUID(), origin);
    const call = (path: string, body: unknown, cookie?: string) =>
      auth.handler(
        new Request(`${origin}/api/auth/${path}`, {
          method: "POST",
          headers: {
            origin,
            "content-type": "application/json",
            ...(cookie ? { cookie } : {}),
          },
          body: JSON.stringify(body),
        }),
      );
    const login = await call("sign-in/email", {
      email: a.email,
      password: a.password,
    });
    assert.equal(login.status, 200);
    const cookie = login.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    assert.ok(cookie);
    assert.match(login.headers.getSetCookie().join(";"), /httponly/i);
    const result = await auth.api.getSession({
      headers: new Headers({ cookie }),
    });
    assert.ok(result);
    const authAfterRestart = createAuthentication(
      db,
      randomUUID() + randomUUID(),
      origin,
    );
    // A changed signing secret must reject the cookie; a stable secret is tested by actual server restart.
    assert.equal(
      await authAfterRestart.api.getSession({
        headers: new Headers({ cookie }),
      }),
      null,
    );
    const wrong = await call(
      "change-password",
      { currentPassword: randomUUID(), newPassword: randomUUID() },
      cookie,
    );
    assert.equal(wrong.status, 400);
    assert.ok(await auth.api.getSession({ headers: new Headers({ cookie }) }));
    const changed = await call(
      "change-password",
      { currentPassword: a.password, newPassword: randomUUID() },
      cookie,
    );
    assert.equal(changed.status, 200);
    assert.equal(await db.session.count({ where: { userId: a.id } }), 0);
    assert.equal(
      (await db.user.findUniqueOrThrow({ where: { id: a.id } }))
        .mustChangePassword,
      false,
    );
    console.log(
      "PASS library password verification, revocation, cookies, and changed-secret rejection.",
    );
    const expiresLogin = await call("sign-in/email", {
      email: admin.email,
      password: admin.password,
    });
    assert.equal(expiresLogin.status, 200);
    const expiresCookie = expiresLogin.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const attributes = expiresLogin.headers.getSetCookie().join(";");
    assert.match(attributes, /Max-Age=28800/i);
    assert.match(attributes, /SameSite=Lax/i);
    assert.doesNotMatch(attributes, /; Secure/i);
    await db.session.updateMany({
      where: { userId: admin.id },
      data: { expiresAt: new Date(0) },
    });
    assert.equal(
      await auth.api.getSession({
        headers: new Headers({ cookie: expiresCookie }),
      }),
      null,
    );
    assert.equal(
      await auth.api.getSession({
        headers: new Headers({
          cookie: "private-session.session_token=forged",
        }),
      }),
      null,
    );
    let throttled = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      const response = await call("sign-in/email", {
        email: "unregistered@example.invalid",
        password: randomUUID(),
      });
      if (response.status === 429) {
        throttled = true;
        break;
      }
    }
    assert.ok(throttled, "HTTP password attempts must be rate limited");
    console.log(
      "PASS development cookie attributes, expired/forged sessions and HTTP rate limiting.",
    );
    console.log(
      `Access matrix: ${positive} positive + ${negative} negative passed. Owned fixtures cleaned up.`,
    );
  } finally {
    for (const id of users.reverse()) await removeFixtureUser(db, id);
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Access verification failed. Inspect the last safe PASS label; no credentials or record values logged.",
  );
  process.exitCode = 1;
});
