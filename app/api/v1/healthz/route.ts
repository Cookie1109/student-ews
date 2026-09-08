import { prisma } from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonResponse({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check error:", err);
    return errorResponse("Database disconnected", "SERVICE_UNAVAILABLE", 503);
  }
}
