import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";
import { requireProgramPermission } from "@/lib/auth/data-scope";

interface CloneInput {
  sourceTrainingProgramId?: string;
  targetTrainingProgramId?: string;
  cohortId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody<CloneInput>(request, 2 * 1024 * 1024);
    if (!body.sourceTrainingProgramId || !body.targetTrainingProgramId || !body.cohortId) {
      return errorResponse("sourceTrainingProgramId, targetTrainingProgramId and cohortId are required", "INVALID_REQUEST", 400);
    }
    const sourceAuth = await requireProgramPermission(request, body.sourceTrainingProgramId, "progress.plan.manage");
    if (!sourceAuth.authorized) return sourceAuth.response;
    const targetAuth = await requireProgramPermission(request, body.targetTrainingProgramId, "progress.plan.manage");
    if (!targetAuth.authorized) return targetAuth.response;
    return jsonResponse(await TrainingProgressService.previewPlanClone({
      sourceTrainingProgramId: body.sourceTrainingProgramId,
      targetTrainingProgramId: body.targetTrainingProgramId,
      cohortId: body.cohortId,
    }));
  } catch (error) {
    return apiErrorResponse(error, "Failed to preview plan clone");
  }
}
