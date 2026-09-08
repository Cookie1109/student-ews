import { NextRequest } from "next/server";
import { FeePoliciesService } from "@/lib/services/fee-policies";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse } from "@/lib/utils/api-error";
import { requireStudentPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; feePolicyId: string }> }
) {
  try {
    const { id, feePolicyId } = await params;
    const auth = await requireStudentPermission(req, id, "fee_policy.read");
    if (!auth.authorized) return auth.response;
    const item = await FeePoliciesService.getById(feePolicyId, id);
    if (!item) return errorResponse("Fee policy not found", "NOT_FOUND", 404);
    return jsonResponse(item);
  } catch (err) {
    console.error("Get fee policy error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; feePolicyId: string }> }
) {
  try {
    const { id, feePolicyId } = await params;
    const auth = await requireStudentPermission(req, id, "fee_policy.update");
    if (!auth.authorized) return auth.response;
    const body = await req.json();
    const updated = await FeePoliciesService.update(id, feePolicyId, body);
    return jsonResponse(updated);
  } catch (err) {
    return apiErrorResponse(err, "Failed to update fee policy");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; feePolicyId: string }> }
) {
  try {
    const { id, feePolicyId } = await params;
    const auth = await requireStudentPermission(req, id, "fee_policy.delete");
    if (!auth.authorized) return auth.response;
    await FeePoliciesService.delete(id, feePolicyId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err, "Failed to delete fee policy");
  }
}
