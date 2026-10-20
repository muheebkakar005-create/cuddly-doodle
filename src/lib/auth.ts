import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "qsc_session";

export type SessionUser = {
  userId: string;
  email: string;
  role: string;
  salonId?: string;
};

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
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
    if (role !== "admin" && role !== "owner") return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role,
      salonId: payload.salonId ? String(payload.salonId) : undefined,
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

export function sessionCookieOptions() {
  const isHttps = process.env.SECURE_COOKIES === "true";
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days (1 month persistent session)
  };
}

/** @deprecated use sessionCookieOptions */
export const adminCookieOptions = sessionCookieOptions;
