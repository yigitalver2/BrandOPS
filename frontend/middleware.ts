import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// /login dışındaki tüm uygulamayı korur. Edge runtime'da çalışır (jose).
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === "/login";

  if (session) {
    // Giriş yapmış kullanıcıyı login sayfasından uzaklaştır.
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Oturum yok.
  if (isAuthPage) return NextResponse.next();

  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // api/auth, Next statikleri, icon ve nokta içeren statik dosyalar (mock JSON dahil) hariç.
  matcher: ["/((?!api/auth|_next/static|_next/image|icon.svg|.*\\..*).*)"],
};
