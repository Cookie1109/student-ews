import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requirePlanPermission } from "@/lib/auth/data-scope";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requirePlanPermission(req, id, "progress.plan.manage");
    if (!auth.authorized) return auth.response;
    const plan = await TrainingProgressService.archivePlan(id);
    return jsonResponse(plan);
  } catch (e: any) {
    if (e.message === "Plan not found") return errorResponse("Plan not found", "NOT_FOUND", 404);
    if (e.message?.includes("draft") || e.message?.includes("locked")) return errorResponse(e.message, "INVALID_STATE", 422);
    return errorResponse(e.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
