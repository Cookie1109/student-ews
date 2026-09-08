import { NextRequest } from "next/server";
import { DecisionsService } from "@/lib/services/decisions";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse } from "@/lib/utils/api-error";
import { requireStudentPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; decisionId: string }> }
) {
  try {
    const { id, decisionId } = await params;
    const auth = await requireStudentPermission(req, id, "decision.read");
    if (!auth.authorized) return auth.response;
    const item = await DecisionsService.getById(decisionId, id);
    if (!item) return errorResponse("Decision not found", "NOT_FOUND", 404);
    return jsonResponse(item);
  } catch (err) {
    console.error("Get decision error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; decisionId: string }> }
) {
  try {
    const { id, decisionId } = await params;
    const auth = await requireStudentPermission(req, id, "decision.update");
    if (!auth.authorized) return auth.response;
    const body = await req.json();
    const updated = await DecisionsService.update(id, decisionId, body);
    return jsonResponse(updated);
  } catch (err) {
    return apiErrorResponse(err, "Failed to update decision");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; decisionId: string }> }
) {
  try {
    const { id, decisionId } = await params;
    const auth = await requireStudentPermission(req, id, "decision.delete");
    if (!auth.authorized) return auth.response;
    await DecisionsService.delete(id, decisionId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err, "Failed to delete decision");
  }
}
