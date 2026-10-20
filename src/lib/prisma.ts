import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const DEFAULT_DATABASE_URL =
  "postgresql://neondb_owner:npg_PIumd5bNZhg1@ep-plain-sky-b5iop4fl-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&connection_limit=20&pool_timeout=30";

export function getCleanDatasourceUrl(): string {
  let url = (process.env.DATABASE_URL || "").trim() || DEFAULT_DATABASE_URL;
  // Strip channel_binding if present (causes SCRAM auth failure with Prisma engine in serverless environments)
  url = url.replace(/([?&])channel_binding=[^&]*(&|$)/g, (_m, prefix, suffix) => {
    return suffix === "&" ? prefix : "";
  });
  if (!url.includes("sslmode=")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }
  if (!url.includes("connect_timeout=")) {
    url += "&connect_timeout=30";
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: getCleanDatasourceUrl(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Retry a Prisma operation up to `retries` times.
 * Handles Neon cold-start and connection pooling hiccups gracefully.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 800
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes("Can't reach database") ||
        msg.includes("Connection closed") ||
        msg.includes("kind: Closed") ||
        msg.includes("connection pool") ||
        msg.includes("ConnectionReset") ||
        msg.includes("timed out") ||
        msg.includes("P2024");
      if (!isRetryable || i === retries - 1) throw err;
      // Wait before retrying
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      // Reconnect
      try {
        await prisma.$disconnect();
      } catch {}
      try {
        await prisma.$connect();
      } catch {}
    }
  }
  throw lastError;
}
