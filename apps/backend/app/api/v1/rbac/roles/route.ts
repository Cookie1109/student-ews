import { RbacService } from "@/lib/services/rbac";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const roles = await RbacService.listRoles();
    return jsonResponse({ items: roles, total: roles.length });
  } catch (err) {
    console.error("List roles error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
