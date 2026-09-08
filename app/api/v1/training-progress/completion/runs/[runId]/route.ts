import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { completionRunClassScope, requireCompletionRunPermission } from "@/lib/auth/data-scope";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const auth = await requireCompletionRunPermission(req, runId, "progress.read");
    if (!auth.authorized) return auth.response;
    const run = await TrainingProgressService.getCompletionRunDetail(runId, await completionRunClassScope(auth.actor, runId));
    if (!run) return errorResponse("Completion run not found", "NOT_FOUND", 404);
    return jsonResponse(run);
  } catch (e: any) {
    return errorResponse(e.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
