import { NextRequest } from "next/server";
import { AcademicWarningsService } from "@/lib/services/academic-warnings";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requireStudentPermission, requireWarningRunPermission } from "@/lib/auth/data-scope";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string; studentId: string }> }) {
  try {
    const { runId, studentId } = await params;
    const runAuth = await requireWarningRunPermission(req, runId, "academic_warning.read");
    if (!runAuth.authorized) return runAuth.response;
    const studentAuth = await requireStudentPermission(req, studentId, "academic_warning.read");
    if (!studentAuth.authorized) return studentAuth.response;
    const result = await AcademicWarningsService.getStudentResult(runId, studentId);
    if (!result) return errorResponse("Student result not found", "NOT_FOUND", 404);
    return jsonResponse(result);
  } catch (e: any) {
    return errorResponse(e.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
}
