import { NextRequest } from "next/server";
import { FeePoliciesService } from "@/lib/services/fee-policies";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { requirePermission } from "@/lib/auth/authorize";
import { studentScopeWhere } from "@/lib/auth/data-scope";

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission("fee_policy.import", req);
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<unknown>(req, 5 * 1024 * 1024);
    if (!Array.isArray(body)) {
      return errorResponse("Expected an array of fee policy records", "INVALID_REQUEST", 400);
    }
    const result = await FeePoliciesService.importFeePolicies(body, await studentScopeWhere(auth.actor));
    return jsonResponse(result);
  } catch (err) {
    return apiErrorResponse(err, "Failed to import fee policies");
  }
}
