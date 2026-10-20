import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionCookieOptions, signSessionToken, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  // 1. Look up user by email
  let user = await prisma.user.findUnique({ where: { email } });

  // Fallback for admin email variations (muheebkaka005@gmail.com / muheebkakar005@gmail.com)
  if (!user && (email === "muheebkaka005@gmail.com" || email === "muheebkakar005@gmail.com")) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "muheebkakar005@gmail.com" },
          { email: "muheebkaka005@gmail.com" },
          { role: "admin" },
        ],
      },
    });
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 2. Verify password
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 3. Generate secure signed session JWT
  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    salonId: user.salonId || undefined,
  });

  // 4. Return role-based response with redirect
  const redirect = user.role === "admin" ? "/super-admin/dashboard" : "/shop-owner/dashboard";

  const res = NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    salonId: user.salonId,
    redirect,
  });

  const cookie = sessionCookieOptions();
  res.cookies.set(cookie.name, token, cookie);
  return res;
}
