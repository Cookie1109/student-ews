import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, parsePagination } from "@/lib/utils/api-response";
import { completionRunClassScope, requireCompletionRunPermission } from "@/lib/auth/data-scope";
import { apiErrorResponse } from "@/lib/utils/api-error";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const auth = await requireCompletionRunPermission(req, runId, "progress.read");
    if (!auth.authorized) return auth.response;
    const url = new URL(req.url);
    const groupType = url.searchParams.get("groupType") || undefined;
    const { page, pageSize } = parsePagination(url.searchParams);
    const result = await TrainingProgressService.listCompletionGroups(
      runId,
      groupType,
      page,
      pageSize,
      await completionRunClassScope(auth.actor, runId),
    );
    return jsonResponse(result);
  } catch (error) {
    return apiErrorResponse(error, "Failed to list completion groups");
  }
}
