import { NextRequest } from "next/server";
import { FeePoliciesService } from "@/lib/services/fee-policies";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { jsonResponse } from "@/lib/utils/api-response";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJsonBody<{ feeObjectDicName?: string; isActive?: boolean }>(request);
    return jsonResponse(await FeePoliciesService.updateType(id, body));
  } catch (error) {
    return apiErrorResponse(error, "Failed to update fee policy type");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await FeePoliciesService.removeType(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete fee policy type");
  }
}
