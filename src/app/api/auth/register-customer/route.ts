import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, sessionCookieOptions, signSessionToken } from "@/lib/auth";
import { normalizePakistaniPhone } from "@/lib/phone";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const rawPhone = String(body.phone || "");
  const phone = normalizePakistaniPhone(rawPhone);

  if (!name || !email || password.length < 6 || !phone) {
    return NextResponse.json(
      { error: "Name, email, valid Pakistani mobile number (03XX-XXXXXXX), and a password of at least 6 characters are required." },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role: "customer",
      name,
      phone,
    },
  });

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: "customer",
    name: user.name,
    phone: user.phone,
  });

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: "customer" },
    redirect: "/bookings",
  }, { status: 201 });
  
  const cookie = sessionCookieOptions();
  res.cookies.set(cookie.name, token, cookie);
  return res;
}
