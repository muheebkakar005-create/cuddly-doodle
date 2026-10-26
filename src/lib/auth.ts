import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { isProductionRuntime } from "./appUrl";

export const SESSION_COOKIE = "qsc_session";

export type SessionUser = {
  userId: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  salonId?: string;
  staffId?: string;
  permissions?: string[];
};

function secret() {
  const value = process.env.JWT_SECRET || "";
  if (isProductionRuntime() && (!value || value === "dev-secret" || value.length < 16)) {
    throw new Error("JWT_SECRET must be set to a strong value in production.");
  }
  return new TextEncoder().encode(value || "dev-secret-local-only");
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function signSessionToken(payload: SessionUser) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const role = String(payload.role || "");
    if (!["admin", "owner", "staff", "customer"].includes(role)) return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role,
      name: payload.name ? String(payload.name) : undefined,
      phone: payload.phone ? String(payload.phone) : undefined,
      salonId: payload.salonId ? String(payload.salonId) : undefined,
      staffId: payload.staffId ? String(payload.staffId) : undefined,
      permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : undefined,
    };
  } catch {
    return null;
  }
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAdminSession() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function getOwnerSession() {
  const session = await getSession();
  if (!session || session.role !== "owner") return null;
  return session;
}

export function isAdmin(session: SessionUser | null) {
  return session?.role === "admin";
}

export function canManageSalon(session: SessionUser | null, salonId: string) {
  if (!session) return false;
  if (session.role === "admin") return true;
  return session.role === "owner" && session.salonId === salonId;
}

export function canManageBookings(session: SessionUser | null, salonId: string) {
  if (canManageSalon(session, salonId)) return true;
  if (!session || session.salonId !== salonId) return false;
  if (session.role === "staff") {
    return !session.permissions || session.permissions.includes("bookings");
  }
  return false;
}

export function canManagePayments(session: SessionUser | null, salonId: string) {
  if (canManageSalon(session, salonId)) return true;
  return Boolean(session?.role === "staff" && session.salonId === salonId && session.permissions?.includes("payments"));
}

export function sessionCookieOptions() {
  const isHttps = process.env.NODE_ENV === "production" || process.env.SECURE_COOKIES === "true";
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export const adminCookieOptions = sessionCookieOptions;
