import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/life/:path*", "/life", "/api/life/:path*"],
};

const PUBLIC_PATHS = ["/admin/login", "/api/admin/login", "/api/admin/logout"];

export async function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isValid = await verifySessionToken(token);

  if (!isValid) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    // The personal area shares the admin login; send the user back there afterwards.
    if (request.nextUrl.pathname.startsWith("/life")) loginUrl.searchParams.set("next", "/life");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
