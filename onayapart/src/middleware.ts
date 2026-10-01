import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyStaffSessionToken, permissionForPath, pathForPermission } from "@/lib/staffAuth";

/** /panel ve /musteri altindaki sayfalar kendi oturumlariyla korunur. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/panel") && !pathname.startsWith("/panel/giris")) {
    const panelCookie = req.cookies.get("oa_panel")?.value;
    const isFullAdmin =
      Boolean(panelCookie) && Boolean(process.env.PANEL_PASSWORD) && panelCookie === process.env.PANEL_PASSWORD;

    if (isFullAdmin) return NextResponse.next();

    // Tam admin degil: sinirli yetkili personel oturumuna bak.
    const staffToken = req.cookies.get("oa_staff")?.value;
    const session = await verifyStaffSessionToken(process.env.PANEL_PASSWORD ?? "", staffToken);

    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/panel/giris";
      return NextResponse.redirect(url);
    }

    // /panel kok sayfasi ve /panel/kullanicilar gibi eslesmesiz yollar sadece tam admin icindir.
    const requiredPerm = permissionForPath(pathname);
    if (!requiredPerm || !session.permissions.includes(requiredPerm)) {
      const firstAllowed = session.permissions[0];
      const url = req.nextUrl.clone();
      url.pathname = firstAllowed ? pathForPermission(firstAllowed) : "/panel/giris";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/musteri") && !pathname.startsWith("/musteri/giris")) {
    const guestId = req.cookies.get("oa_guest")?.value;
    if (guestId) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/musteri/giris";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*", "/musteri/:path*"] };
