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
    const auth = await requireStudentPermission(req, id, "grade.export");
    if (!auth.authorized) return auth.response;
    const items = await GradesService.exportGrades(id);
    return jsonResponse(items);
  } catch (err) {
    console.error("Export grades error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
