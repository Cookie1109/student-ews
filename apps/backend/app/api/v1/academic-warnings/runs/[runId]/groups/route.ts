import { NextRequest } from "next/server";
import { AcademicWarningsService } from "@/lib/services/academic-warnings";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requireWarningRunPermission, warningRunClassScope } from "@/lib/auth/data-scope";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const auth = await requireWarningRunPermission(req, runId, "academic_warning.read");
    if (!auth.authorized) return auth.response;
    const groups = await AcademicWarningsService.listGroupResults(
      runId,
      await warningRunClassScope(auth.actor, runId),
    );
    return jsonResponse({ items: groups, total: groups.length });
  } catch (e: any) {
    return errorResponse(e.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
