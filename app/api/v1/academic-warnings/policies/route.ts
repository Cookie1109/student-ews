import { NextRequest } from "next/server";
import { AcademicWarningsService } from "@/lib/services/academic-warnings";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";

export async function GET() {
  try {
    const policies = await AcademicWarningsService.listPolicies();
    return jsonResponse({ items: policies, total: policies.length });
  } catch (err) {
    console.error("List policies error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{
      name?: string;
      policyName?: string;
      termGpaThreshold?: number;
      cumulativeGpaThreshold?: number;
      status?: string;
    }>(req);
    const name = body.name || body.policyName;
    if (!name) {
      return errorResponse("name is required", "INVALID_REQUEST", 400);
    }
    const created = await AcademicWarningsService.createPolicy({ ...body, name });
    return jsonResponse(created, 201);
  } catch (err) {
    return apiErrorResponse(err, "Failed to create warning policy");
  }
}
