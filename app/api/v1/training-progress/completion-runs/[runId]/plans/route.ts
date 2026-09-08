import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { completionRunClassScope, requireCompletionRunPermission } from "@/lib/auth/data-scope";
import { apiErrorResponse } from "@/lib/utils/api-error";
import { jsonResponse, parsePagination } from "@/lib/utils/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const auth = await requireCompletionRunPermission(request, runId, "progress.read");
    if (!auth.authorized) return auth.response;
    const { page, pageSize } = parsePagination(request.nextUrl.searchParams);
    return jsonResponse(await TrainingProgressService.listCompletionPlanSummaries(
      runId,
      page,
      pageSize,
      await completionRunClassScope(auth.actor, runId),
    ));
  } catch (error) {
    return apiErrorResponse(error, "Failed to list completion-plan summaries");
  }
}
