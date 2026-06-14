import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Guards all routes except /login. Runs in the Edge runtime (jose).
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === "/login";

  if (session) {
    // Redirect authenticated users away from the login page.
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // No session.
  if (isAuthPage) return NextResponse.next();

  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Exclude api/auth, Next statics, icons, and dot-extension static files (mock JSON included).
  matcher: ["/((?!api/auth|_next/static|_next/image|icon.svg|.*\\..*).*)"],
};
