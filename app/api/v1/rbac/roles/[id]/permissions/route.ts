import { NextRequest } from "next/server";
import { RbacService } from "@/lib/services/rbac";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const permissions = await RbacService.listRolePermissions(id);
    return jsonResponse({ items: permissions, total: permissions.length });
  } catch (error) {
    return apiErrorResponse(error, "Failed to list role permissions");
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJsonBody<{ permissionCodes?: unknown }>(request);
    if (!Array.isArray(body.permissionCodes) || !body.permissionCodes.every((code) => typeof code === "string")) {
      return errorResponse("permissionCodes must be an array of strings", "INVALID_REQUEST", 400);
    }
    const permissions = await RbacService.replaceRolePermissions(id, body.permissionCodes);
    return jsonResponse({ items: permissions, total: permissions.length });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update role permissions");
  }
}
