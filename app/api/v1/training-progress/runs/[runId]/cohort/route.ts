import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { progressRunClassScope, requireProgressRunPermission } from "@/lib/auth/data-scope";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const auth = await requireProgressRunPermission(req, runId, "progress.read");
    if (!auth.authorized) return auth.response;
    const classScope = await progressRunClassScope(auth.actor, runId);
    if (classScope !== null) {
      return errorResponse("Cohort aggregate is outside assigned-class scope", "FORBIDDEN", 403);
    }
    const result = await TrainingProgressService.getCohortResult(runId);
    if (!result) return errorResponse("Cohort result not found", "NOT_FOUND", 404);
    return jsonResponse(result);
  } catch (e: any) {
    return errorResponse(e.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
