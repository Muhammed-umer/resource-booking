import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/**
 * Everything except the sign-in screen, the public calendar API and Next's own
 * assets requires a valid session cookie. Roles are enforced per route in the
 * layouts and per action in the Server Actions — this only keeps signed-out
 * visitors out.
 */
const PUBLIC_PATHS = ["/sign-in", "/api/calendar"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (session) return NextResponse.next();

  // An API client wants a status code it can branch on, not an HTML redirect.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Sign in to call this endpoint." },
      { status: 401 },
    );
  }

  const response = NextResponse.redirect(new URL("/sign-in", request.url));
  // Drop a cookie that failed verification so it is not re-sent forever.
  if (request.cookies.has(SESSION_COOKIE)) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}

export const config = {
  matcher: [
    // Skip Next internals and static files unless they show up in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
