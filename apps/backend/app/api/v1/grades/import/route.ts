import { NextRequest } from "next/server";
import { GradesService } from "@/lib/services/grades";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { requirePermission } from "@/lib/auth/authorize";
import { studentScopeWhere } from "@/lib/auth/data-scope";

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission("grade.import", req);
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<unknown>(req, 10 * 1024 * 1024);
    if (!Array.isArray(body)) {
      return errorResponse("Expected an array of grade records", "INVALID_REQUEST", 400);
    }

    const idempotencyKey = req.headers.get("Idempotency-Key") || undefined;
    const result = await GradesService.importGrades(body, idempotencyKey, await studentScopeWhere(auth.actor));
    return jsonResponse(result);
  } catch (err) {
    return apiErrorResponse(err, "Failed to import grades");
  }
}
