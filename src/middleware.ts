import { NextResponse, type NextRequest } from "next/server";

/**
 * Lapis pertama penjagaan /admin (PRD bagian 8).
 *
 * Hanya memeriksa keberadaan cookie sesi, bukan keabsahannya: middleware
 * berjalan di edge dan memverifikasi tanda tangan di sini berarti menaruh
 * SESSION_SECRET di runtime edge untuk tiap permintaan. Keabsahan diperiksa
 * di halaman dan di server action, yang juga memeriksa peran. Ini menahan
 * lalu lintas yang jelas tidak punya sesi, bukan pengganti pemeriksaan itu.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (!request.cookies.get("holo_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  // Dashboard tidak boleh terindeks, dan tidak boleh disimpan proxy mana pun.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
