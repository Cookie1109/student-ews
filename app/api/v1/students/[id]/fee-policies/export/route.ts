import { NextRequest } from "next/server";
import { FeePoliciesService } from "@/lib/services/fee-policies";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requireStudentPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireStudentPermission(req, id, "fee_policy.export");
    if (!auth.authorized) return auth.response;
    const items = await FeePoliciesService.list(id);
    return jsonResponse(items);
  } catch (err) {
    console.error("Export fee policies error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
