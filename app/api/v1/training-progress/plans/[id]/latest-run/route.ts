import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { planClassScope, requirePlanPermission } from "@/lib/auth/data-scope";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requirePlanPermission(req, id, "progress.read");
    if (!auth.authorized) return auth.response;
    const run = await TrainingProgressService.getLatestRunForPlan(id, await planClassScope(auth.actor, id));
    if (!run) return errorResponse("No runs found for this plan", "NOT_FOUND", 404);
    return jsonResponse(run);
  } catch (e: any) {
    return errorResponse(e.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
