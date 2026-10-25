import { PrismaClient } from "@prisma/client";

const PRISMA_CLIENT_VERSION = "2.2-keepalive";
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaVersion: string | undefined;
};

function getDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Ensure connection parameters for cloud poolers with high latency
  if (!url.includes("connect_timeout")) {
    url += (url.includes("?") ? "&" : "?") + "connect_timeout=30";
  }
  if (!url.includes("pool_timeout")) {
    url += (url.includes("?") ? "&" : "?") + "pool_timeout=30";
  }
  if (!url.includes("sslmode")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }
  if (!url.includes("keepalives=")) {
    url += (url.includes("?") ? "&" : "?") + "keepalives=1&keepalives_idle=20&keepalives_interval=5&keepalives_count=3";
  }
  if (!url.includes("connection_limit=")) {
    url += (url.includes("?") ? "&" : "?") + "connection_limit=5";
  }
  return url;
}

const dbUrl = getDatabaseUrl();

if (globalForPrisma.prismaVersion !== PRISMA_CLIENT_VERSION && globalForPrisma.prisma) {
  // Gracefully discard old client instance that had short timeouts
  globalForPrisma.prisma.$disconnect().catch(() => {});
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION;
}

