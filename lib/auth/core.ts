import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import type { PrismaClient } from "../../generated/prisma/client";
import { signInSchema, changePasswordSchema } from "./schemas";

export function createAuthentication(
  db: PrismaClient,
  secret: string,
  baseURL: string,
) {
  return betterAuth({
    appName: "PrivateSession",
    secret,
    baseURL,
    trustedOrigins: [new URL(baseURL).origin],
    database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 28800,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    advanced: {
      cookiePrefix: "private-session",
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      // Ignore spoofable forwarding headers. Unknown IPs share the library's
      // per-path bucket; disableIpTracking would also disable its rate limiter.
      ipAddress: { ipAddressHeaders: [] },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 10,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 10, max: 10 },
        "/change-password": { window: 10, max: 5 },
      },
    },
    user: {
      additionalFields: {
        role: {
          type: ["MEMBER", "ADMIN"],
          defaultValue: "MEMBER",
          input: false,
        },
        status: {
          type: ["ACTIVE", "DISABLED"],
          defaultValue: "ACTIVE",
          input: false,
        },
        mustChangePassword: {
          type: "boolean",
          defaultValue: true,
          input: false,
        },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await db.user.findUnique({
              where: { id: session.userId },
            });
            if (!user || user.status !== "ACTIVE")
              throw new APIError("UNAUTHORIZED", {
                message: "Email or password is incorrect.",
              });
            return { data: session };
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-in/email") {
          const parsed = signInSchema.safeParse(ctx.body);
          if (!parsed.success)
            throw new APIError("BAD_REQUEST", {
              message: "Check the sign-in fields.",
            });
          ctx.body.email = parsed.data.email;
        }
        if (ctx.path === "/change-password") {
          // Confirmation is validated in the HTTP boundary; repeat authoritative password rules here.
          const parsed = changePasswordSchema.safeParse({
            currentPassword: ctx.body.currentPassword,
            newPassword: ctx.body.newPassword,
            confirmation: ctx.body.newPassword,
          });
          if (!parsed.success)
            throw new APIError("BAD_REQUEST", {
              message:
                "Check the password fields; choose a different password.",
            });
          const session = ctx.context.session;
          // The built-in endpoint also authenticates its session. Status is checked again after completion.
          if (session && session.user.status !== "ACTIVE")
            throw new APIError("UNAUTHORIZED");
          ctx.body.revokeOtherSessions = true;
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (
          ctx.path !== "/change-password" ||
          ctx.context.returned instanceof APIError
        )
          return;
        const returned = ctx.context.returned;
        if (
          !returned ||
          typeof returned !== "object" ||
          !("user" in returned) ||
          !("token" in returned)
        )
          return;
        const session = ctx.context.session;
        if (!session) return;
        await db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${session.user.id} FOR UPDATE`;
          await tx.user.update({
            where: { id: session.user.id },
            data: { mustChangePassword: false },
          });
          await tx.session.deleteMany({ where: { userId: session.user.id } });
        });
      }),
    },
    logger: { disabled: true },
    telemetry: { enabled: false },
  });
}
