import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  let sanitizedUrl = "NOT_SET";
  if (dbUrl) {
    try {
      const u = new URL(dbUrl);
      sanitizedUrl = `${u.protocol}//${u.username}:****@${u.host}${u.pathname}?${u.searchParams.toString()}`;
    } catch {
      sanitizedUrl = "INVALID_URL_FORMAT";
    }
  }

  let dbStatus = "unknown";
  let salonCount = 0;
  let dbError: string | null = null;

  try {
    const count = await prisma.salon.count();
    salonCount = count;
    dbStatus = "connected";
  } catch (err: unknown) {
    dbStatus = "failed";
    dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "error",
    database: {
      urlConfigured: Boolean(dbUrl),
      sanitizedUrl,
      dbStatus,
      salonCount,
      dbError,
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV || "unknown",
      HAS_JWT_SECRET: Boolean(process.env.JWT_SECRET),
      HAS_CLOUDINARY: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    },
    timestamp: new Date().toISOString(),
  });
}
