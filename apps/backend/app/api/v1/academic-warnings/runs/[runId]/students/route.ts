import { NextRequest } from "next/server";
import { AcademicWarningsService } from "@/lib/services/academic-warnings";
import { jsonResponse, errorResponse, parsePagination } from "@/lib/utils/api-response";
import { requireWarningRunPermission, warningRunClassScope } from "@/lib/auth/data-scope";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const auth = await requireWarningRunPermission(req, runId, "academic_warning.read");
    if (!auth.authorized) return auth.response;
    const url = new URL(req.url);
    const reasonCode = url.searchParams.get("reasonCode") || undefined;
    const severity = url.searchParams.get("severity") || undefined;
    const classId = url.searchParams.get("classId") || undefined;
    const registrationStatus = url.searchParams.get("registrationStatus") || undefined;
    const scheduleStatus = url.searchParams.get("scheduleStatus") || undefined;
    const { page, pageSize } = parsePagination(url.searchParams);
    const result = await AcademicWarningsService.listStudentResults(
      runId,
      reasonCode,
      severity,
      classId,
      registrationStatus,
      scheduleStatus,
      page,
      pageSize,
      await warningRunClassScope(auth.actor, runId),
    );
    return jsonResponse(result);
  } catch (e: any) {
    return errorResponse(e.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
