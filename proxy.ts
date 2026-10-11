import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, verifyToken } from "@/lib/auth";

// Layer 1 of admin protection: a fast check before any /admin page is rendered.
// It only verifies the JWT in the cookie (no database call, since this runs on every matching request).
// Layer 2 is the check in app/admin/layout.tsx, and every /api/admin route checks again with requireAdmin().
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (session?.role !== "ADMIN") {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
