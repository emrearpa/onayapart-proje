import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIES, verifySessionToken } from "@/features/auth/session";
import { PANEL_LOGIN_PATH, permissionForPath, pathForPermission } from "@/features/auth/permissions";

const GUEST_LOGIN_PATH = "/musteri/giris";

function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

/**
 * /panel ve /musteri altindaki sayfalarin ilk savunma hatti. Burada yalnizca
 * imzali token dogrulanir (Edge'de veritabani yok); asil yetki kontrolu sayfa
 * ve server action'larda `features/auth/guards` ile tekrar yapilir.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/panel")) {
    if (pathname === PANEL_LOGIN_PATH) return NextResponse.next();

    if (await verifySessionToken("admin", req.cookies.get(SESSION_COOKIES.admin)?.value)) {
      return NextResponse.next();
    }

    const staff = await verifySessionToken("staff", req.cookies.get(SESSION_COOKIES.staff)?.value);
    if (!staff) return redirectTo(req, PANEL_LOGIN_PATH);

    // /panel kok sayfasi ve /panel/kullanicilar gibi eslesmesiz yollar sadece tam admin icindir.
    const required = permissionForPath(pathname);
    if (!required || !staff.permissions.includes(required)) {
      const firstAllowed = staff.permissions[0];
      return redirectTo(req, firstAllowed ? pathForPermission(firstAllowed) : PANEL_LOGIN_PATH);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/musteri") && pathname !== GUEST_LOGIN_PATH) {
    const guest = await verifySessionToken("guest", req.cookies.get(SESSION_COOKIES.guest)?.value);
    if (!guest) return redirectTo(req, GUEST_LOGIN_PATH);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*", "/musteri/:path*"] };
