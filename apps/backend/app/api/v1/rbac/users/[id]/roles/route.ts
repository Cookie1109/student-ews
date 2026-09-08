import { NextRequest } from "next/server";
import { RbacService } from "@/lib/services/rbac";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return jsonResponse(await RbacService.listUserRoles(id));
  } catch (error) {
    return apiErrorResponse(error, "Failed to list user roles");
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJsonBody<{ roleCode?: unknown }>(request);
    if (typeof body.roleCode !== "string" || !body.roleCode.trim()) {
      return errorResponse("roleCode is required", "INVALID_REQUEST", 400);
    }
    return jsonResponse(await RbacService.assignUserRole(id, body.roleCode.trim()));
  } catch (error) {
    return apiErrorResponse(error, "Failed to assign user role");
  }
}
