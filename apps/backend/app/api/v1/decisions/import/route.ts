import { NextRequest } from "next/server";
import { DecisionsService } from "@/lib/services/decisions";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { requirePermission } from "@/lib/auth/authorize";
import { studentScopeWhere } from "@/lib/auth/data-scope";

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission("decision.import", req);
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<unknown>(req, 5 * 1024 * 1024);
    if (!Array.isArray(body)) {
      return errorResponse("Expected an array of decisions", "INVALID_REQUEST", 400);
    }
    const result = await DecisionsService.importDecisions(body, await studentScopeWhere(auth.actor));
    return jsonResponse(result);
  } catch (err) {
    return apiErrorResponse(err, "Failed to import decisions");
  }
}
