import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "qsc_session";

type Payload = { role?: string; salonId?: string; permissions?: string[] };

async function session(req: NextRequest): Promise<Payload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || "";
    if (process.env.NODE_ENV === "production" && (!secret || secret === "dev-secret")) {
      return null;
    }
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret || "dev-secret-local-only"));
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

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/owner/login") ||
    pathname.startsWith("/owner/register")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/super-admin") || pathname.startsWith("/admin")) {
    if (user?.role !== "admin") return unauthorized(req, "/login");
    return NextResponse.next();
  }

  if (pathname.startsWith("/shop-owner") || pathname.startsWith("/owner")) {
    if (user?.role !== "owner" && user?.role !== "admin" && user?.role !== "staff") {
      return unauthorized(req, "/login");
    }
    if (user?.role === "staff") {
      const staffBlocked = pathname.startsWith("/owner/payments") || pathname.startsWith("/owner/profile") || pathname === "/owner";
      if (staffBlocked && !user.permissions?.includes("payments")) {
        const url = req.nextUrl.clone();
        url.pathname = "/owner/bookings";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/owner")) {
    if (user?.role !== "owner" && user?.role !== "admin" && user?.role !== "staff") {
      return unauthorized(req, "/login");
    }
    if (user?.role === "staff" && pathname.startsWith("/api/owner/payment-account")) {
      return NextResponse.json({ error: "Staff cannot change payout settings." }, { status: 403 });
    }
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
