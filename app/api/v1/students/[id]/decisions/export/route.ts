import { NextRequest } from "next/server";
import { DecisionsService } from "@/lib/services/decisions";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requireStudentPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireStudentPermission(req, id, "decision.export");
    if (!auth.authorized) return auth.response;
    const items = await DecisionsService.list(id);
    return jsonResponse(items);
  } catch (err) {
    console.error("Export decisions error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
