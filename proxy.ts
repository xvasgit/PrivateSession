import { NextResponse, type NextRequest } from "next/server";
// Presence assists navigation only; all protected reads and mutations verify the database session.
export function proxy(request: NextRequest) {
  if (
    !request.cookies.has("private-session.session_token") &&
    !request.cookies.has("__Secure-private-session.session_token")
  )
    return NextResponse.redirect(new URL("/sign-in/", request.url));
  return NextResponse.next();
}
export const config = {
  matcher: ["/meetings/:path*", "/account/:path*", "/admin/:path*"],
};
