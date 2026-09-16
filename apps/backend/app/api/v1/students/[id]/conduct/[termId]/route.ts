import { NextRequest } from "next/server";
import { requireStudentPermission } from "@/lib/auth/data-scope";
import { ConductService } from "@/lib/services/conduct";
import { apiErrorResponse } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";
import { isUUID } from "@/lib/utils/is-uuid";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; termId: string }> },
) {
  try {
    const { id, termId } = await params;
    if (!isUUID(termId)) return errorResponse("Invalid academic term id", "INVALID_ID", 400);
    const auth = await requireStudentPermission(req, id, "student.read");
    if (!auth.authorized) return auth.response;
    return jsonResponse(await ConductService.detailForStudent(id, termId));
  } catch (error) {
    return apiErrorResponse(error, "Failed to load conduct record");
  }
}
