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

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      salonId: user.salonId || undefined,
    });

    const redirect =
      user.role === "admin"
        ? "/super-admin/dashboard"
        : user.role === "customer"
          ? "/bookings"
          : "/shop-owner/dashboard";

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      salonId: user.salonId,
      redirect,
    });
    const cookie = sessionCookieOptions();
    res.cookies.set(cookie.name, token, cookie);
    return res;
  }

  const staff = await prisma.staff.findUnique({
    where: { loginEmail: email },
    include: { salon: true },
  });
  if (!staff || !staff.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const staffOk = await verifyPassword(password, staff.passwordHash);
  if (!staffOk) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const permissions = [
    staff.canManageBookings ? "bookings" : "",
    staff.canManageServices ? "services" : "",
    staff.canManagePayments ? "payments" : "",
  ].filter(Boolean);

  const token = await signSessionToken({
    userId: staff.userId || staff.id,
    email,
    role: "staff",
    name: staff.name,
    salonId: staff.salonId,
    staffId: staff.id,
    permissions,
  });

  const res = NextResponse.json({
    ok: true,
    userId: staff.id,
    email,
    name: staff.name,
    role: "staff",
    salonId: staff.salonId,
    redirect: "/owner/bookings",
  });
  const cookie = sessionCookieOptions();
  res.cookies.set(cookie.name, token, cookie);
  return res;
}
