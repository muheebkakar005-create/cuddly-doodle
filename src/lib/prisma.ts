import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Neon serverless: keep connections alive and retry on cold start
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Retry a Prisma operation up to `retries` times.
 * Handles Neon cold-start drops gracefully.
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
        msg.includes("kind: Closed");
      if (!isRetryable) throw err;
      // Wait before retrying
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      // Reconnect
      try { await prisma.$disconnect(); } catch {}
      try { await prisma.$connect(); } catch {}
    }
  }
  throw lastError;
}
