import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse, parsePagination } from "@/lib/utils/api-response";
import { progressRunClassScope, requireProgressRunPermission } from "@/lib/auth/data-scope";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const auth = await requireProgressRunPermission(req, runId, "progress.read");
    if (!auth.authorized) return auth.response;
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url.searchParams);
    const result = await TrainingProgressService.listClassResults(
      runId,
      page,
      pageSize,
      await progressRunClassScope(auth.actor, runId),
    );
    return jsonResponse(result);
  } catch (e: any) {
    return errorResponse(e.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
