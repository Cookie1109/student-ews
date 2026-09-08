import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { progressRunClassScope, requireProgressRunPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const auth = await requireProgressRunPermission(req, runId, "progress.read");
    if (!auth.authorized) return auth.response;
    const detail = await TrainingProgressService.getRunDetail(runId, await progressRunClassScope(auth.actor, runId));
    if (!detail) return errorResponse("Run not found", "NOT_FOUND", 404);
    return jsonResponse(detail);
  } catch (err) {
    console.error("Get progress run error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
