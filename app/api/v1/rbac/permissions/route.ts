import { RbacService } from "@/lib/services/rbac";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const permissions = await RbacService.listPermissions();
    return jsonResponse({ items: permissions, total: permissions.length });
  } catch (err) {
    console.error("List permissions error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
