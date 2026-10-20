import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "qsc_session";

type Payload = { role?: string; salonId?: string };

async function session(req: NextRequest): Promise<Payload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"),
    );
    return payload as Payload;
  } catch {
    return null;
  }
}

function unauthorized(req: NextRequest, loginPath = "/login") {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await session(req);

  // Allow public authentication & onboarding routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/owner/login") ||
    pathname.startsWith("/owner/register")
  ) {
    return NextResponse.next();
  }

  // Super Admin routes: strictly restricted to admin role
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/admin")) {
    if (user?.role !== "admin") return unauthorized(req, "/login");
    return NextResponse.next();
  }

  // Shop Owner routes: accessible to owner or admin
  if (pathname.startsWith("/shop-owner") || pathname.startsWith("/owner")) {
    if (user?.role !== "owner" && user?.role !== "admin") return unauthorized(req, "/login");
    return NextResponse.next();
  }

  // API protection
  if (pathname.startsWith("/api/owner")) {
    if (user?.role !== "owner" && user?.role !== "admin") return unauthorized(req, "/login");
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    if (user?.role !== "admin") return unauthorized(req, "/login");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin",
    "/super-admin/:path*",
    "/admin",
    "/admin/:path*",
    "/shop-owner",
    "/shop-owner/:path*",
    "/owner",
    "/owner/:path*",
    "/api/owner/:path*",
    "/api/admin/:path*",
  ],
};
