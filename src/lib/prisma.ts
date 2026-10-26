import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getCleanDatasourceUrl(): string {
  let url = (process.env.DATABASE_URL || "").trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set. Configure a PostgreSQL connection string in the environment.");
  }
  url = url.replace(/([?&])channel_binding=[^&]*(&|$)/g, (_m, prefix, suffix) => {
    return suffix === "&" ? prefix : "";
  });
  if (!url.includes("sslmode=") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }
  if (!url.includes("connect_timeout=")) {
    url += (url.includes("?") ? "&" : "?") + "connect_timeout=30";
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

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 800): Promise<T> {
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
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
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
