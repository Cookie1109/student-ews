import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { RbacService } from "@/lib/services/rbac";
import { apiErrorResponse } from "@/lib/utils/api-error";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requirePermission("advisor_assignment.manage", request);
    if (!auth.authorized) return auth.response;
    const { id } = await params;
    await RbacService.revokeAdvisor(id, auth.actor.userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to revoke advisor assignment");
  }
}
