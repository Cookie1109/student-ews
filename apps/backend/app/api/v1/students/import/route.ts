import { NextRequest } from "next/server";
import { StudentsService } from "@/lib/services/students";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { requirePermission } from "@/lib/auth/authorize";
import { inaccessibleStudentTargetIndexes, studentScopeWhere } from "@/lib/auth/data-scope";

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission("student.import", req);
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<unknown>(req, 5 * 1024 * 1024);
    if (!Array.isArray(body)) {
      return errorResponse("Expected an array of students", "INVALID_REQUEST", 400);
    }
    const inaccessible = await inaccessibleStudentTargetIndexes(auth.actor, body);
    if (inaccessible.length) {
      return errorResponse(`Rows outside data scope: ${inaccessible.slice(0, 20).map((index) => index + 1).join(", ")}`, "NOT_FOUND", 404);
    }

    const result = await StudentsService.importBatch(body, await studentScopeWhere(auth.actor));
    return jsonResponse(result);
  } catch (err) {
    return apiErrorResponse(err, "Failed to import students");
  }
}
