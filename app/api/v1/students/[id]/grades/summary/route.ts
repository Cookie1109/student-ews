import { NextRequest } from "next/server";
import { GradesService } from "@/lib/services/grades";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requireStudentPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireStudentPermission(req, id, "grade.read");
    if (!auth.authorized) return auth.response;
    const summary = await GradesService.summaries(id);
    return jsonResponse(summary);
  } catch (err) {
    console.error("Grade summary error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
