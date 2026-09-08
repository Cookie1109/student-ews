import { NextRequest } from "next/server";
import { StudentDashboardService } from "@/lib/services/student-dashboard";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse } from "@/lib/utils/api-error";
import { requireStudentPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireStudentPermission(req, id, "student.read");
    if (!auth.authorized) return auth.response;
    const dashboard = await StudentDashboardService.getStudentDashboard(
      id,
      auth.actor,
      req.nextUrl.searchParams.get("academicYear") || "",
      req.nextUrl.searchParams.get("termCode") || ""
    );
    if (!dashboard) return errorResponse("Student not found", "NOT_FOUND", 404);
    return jsonResponse(dashboard);
  } catch (err) {
    console.error("Student dashboard error:", err);
    return apiErrorResponse(err, "Failed to load student dashboard");
  }
}
