import { getAuth } from "@/lib/auth/server";
import { getPrisma } from "@/lib/prisma";
import { signInSchema, changePasswordSchema } from "@/lib/auth/schemas";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowed = new Map([
  ["sign-in/email", "POST"],
  ["sign-out", "POST"],
  ["get-session", "GET"],
  ["change-password", "POST"],
]);
async function handle(request: Request) {
  const path = new URL(request.url).pathname
    .replace(/^\/api\/auth\//, "")
    .replace(/\/$/, "");
  if (allowed.get(path) !== request.method)
    return new Response(null, { status: 404 });
  try {
    const auth = getAuth();
    if (
      request.method === "POST" &&
      request.headers.get("origin") !==
        new URL(process.env.BETTER_AUTH_URL!).origin
    )
      return Response.json(
        { message: "Request origin is not allowed." },
        { status: 403 },
      );
    if (path === "sign-in/email" || path === "change-password") {
      if (!request.headers.get("content-type")?.includes("application/json"))
        return new Response(null, { status: 415 });
      const body: unknown = await request.clone().json();
      const parsed = (
        path === "sign-in/email" ? signInSchema.strict() : changePasswordSchema
      ).safeParse(body);
      if (!parsed.success)
        return Response.json(
          {
            message: "Check the fields.",
            fieldErrors: z.flattenError(parsed.error as z.ZodError).fieldErrors,
          },
          { status: 400 },
        );
      if (path === "change-password") {
        const session = await auth.api.getSession({ headers: request.headers });
        if (
          !session ||
          (
            await getPrisma().user.findUnique({
              where: { id: session.user.id },
            })
          )?.status !== "ACTIVE"
        )
          return Response.json(
            { message: "Please sign in again." },
            { status: 401 },
          );
      }
      const data =
        path === "sign-in/email"
          ? parsed.data
          : {
              currentPassword: (
                parsed.data as z.infer<typeof changePasswordSchema>
              ).currentPassword,
              newPassword: (parsed.data as z.infer<typeof changePasswordSchema>)
                .newPassword,
              revokeOtherSessions: true,
            };
      request = new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(data),
      });
    }
    // Next.js uses trailing slashes; Better Auth's endpoint router uses canonical paths.
    const canonical = new URL(request.url);
    canonical.pathname = canonical.pathname.replace(/\/$/, "");
    const response = await auth.handler(
      new Request(canonical, {
        method: request.method,
        headers: request.headers,
        ...(request.method === "POST" ? { body: await request.text() } : {}),
      }),
    );
    // Keep session bearer tokens out of JSON responses. Cookies remain library-managed.
    if (
      response.ok &&
      ["sign-in/email", "change-password", "get-session"].includes(path)
    ) {
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.set("cache-control", "no-store");
      if (path === "get-session") {
        const identity = await auth.api.getSession({
          headers: request.headers,
        });
        const user = identity
          ? await getPrisma().user.findUnique({
              where: { id: identity.user.id },
              select: {
                id: true,
                name: true,
                role: true,
                status: true,
                mustChangePassword: true,
              },
            })
          : null;
        return Response.json(user?.status === "ACTIVE" ? { user } : null, {
          headers,
        });
      }
      return Response.json({ success: true }, { headers });
    }
    return response;
  } catch {
    return Response.json(
      { message: "Authentication is unavailable. Check setup or retry." },
      { status: 503 },
    );
  }
}
export { handle as GET, handle as POST };
