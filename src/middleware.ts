import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/admin/session";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const valid = await isValidSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (valid) return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
