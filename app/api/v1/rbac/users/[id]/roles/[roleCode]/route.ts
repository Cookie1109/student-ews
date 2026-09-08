import { NextRequest } from "next/server";
import { RbacService } from "@/lib/services/rbac";
import { apiErrorResponse } from "@/lib/utils/api-error";
import { jsonResponse } from "@/lib/utils/api-response";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; roleCode: string }> },
) {
  try {
    const { id, roleCode } = await params;
    return jsonResponse(await RbacService.removeUserRole(id, decodeURIComponent(roleCode)));
  } catch (error) {
    return apiErrorResponse(error, "Failed to remove user role");
  }
}
