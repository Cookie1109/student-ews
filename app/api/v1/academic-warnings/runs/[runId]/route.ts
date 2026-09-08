import { NextRequest } from "next/server";
import { AcademicWarningsService } from "@/lib/services/academic-warnings";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requireWarningRunPermission, warningRunClassScope } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const auth = await requireWarningRunPermission(req, runId, "academic_warning.read");
    if (!auth.authorized) return auth.response;
    const detail = await AcademicWarningsService.getRunDetail(runId, await warningRunClassScope(auth.actor, runId));
    if (!detail) return errorResponse("Warning run not found", "NOT_FOUND", 404);
    return jsonResponse(detail);
  } catch (err) {
    console.error("Get warning run error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
