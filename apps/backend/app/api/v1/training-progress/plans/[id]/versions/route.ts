import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { apiErrorResponse } from "@/lib/utils/api-error";
import { jsonResponse } from "@/lib/utils/api-response";
import { requirePlanPermission } from "@/lib/auth/data-scope";

interface Params { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await requirePlanPermission(request, id, "progress.plan.manage");
    if (!auth.authorized) return auth.response;
    return jsonResponse(await TrainingProgressService.createPlanVersion(id), 201);
  } catch (error) {
    return apiErrorResponse(error, "Failed to create plan version");
  }
}
