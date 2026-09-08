import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse, parsePagination } from "@/lib/utils/api-response";
import { requireStudentPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireStudentPermission(req, id, "progress.read");
    if (!auth.authorized) return auth.response;
    const { searchParams } = new URL(req.url);
    const { page, pageSize } = parsePagination(searchParams);

    const result = await TrainingProgressService.listStudentRegistrations(
      id,
      page,
      pageSize,
      searchParams.get("academicYear") || undefined,
      searchParams.get("termCode") || undefined,
      searchParams.get("courseCode") || undefined,
    );
    return jsonResponse(result);
  } catch (err) {
    console.error("List student registrations error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
