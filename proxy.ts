import { NextResponse, type NextRequest } from "next/server";

// Optimistic presence check only. Pages and actions independently validate the session.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("private-session-demo"))
    return NextResponse.redirect(new URL("/demo-sign-in/", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/upload/practicum/:path*"] };
