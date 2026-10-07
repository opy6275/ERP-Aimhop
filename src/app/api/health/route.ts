import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();

  try {
    // Ping database
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    return NextResponse.json(
      {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: {
          status: "connected",
          latencyMs: dbLatencyMs,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Health check database ping failed:", err);
    return NextResponse.json(
      {
        status: "unhealthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: {
          status: "disconnected",
          error:
            process.env.NODE_ENV === "production"
              ? "Database connection failure"
              : (err instanceof Error ? err.message : String(err)),
        },
      },
      { status: 503 }
    );
  }
}
