import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { requireProgressScopePermission } from "@/lib/auth/data-scope";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody<{
      cohortId?: unknown;
      trainingProgramId?: unknown;
      assessmentAcademicTermId?: unknown;
      evaluationMode?: unknown;
    }>(request);
    if (
      typeof body.cohortId !== "string" ||
      typeof body.trainingProgramId !== "string" ||
      typeof body.assessmentAcademicTermId !== "string"
    ) {
      return errorResponse("Completion scope is required", "INVALID_FILTER", 400);
    }
    if (
      body.evaluationMode !== undefined &&
      body.evaluationMode !== "standard" &&
      body.evaluationMode !== "graduation_forecast"
    ) {
      return errorResponse("Invalid evaluationMode", "INVALID_FILTER", 400);
    }
    const auth = await requireProgressScopePermission(request, {
      cohortId: body.cohortId,
      trainingProgramId: body.trainingProgramId,
      academicTermId: body.assessmentAcademicTermId,
    }, "progress.read");
    if (!auth.authorized) return auth.response;
    return jsonResponse(await TrainingProgressService.previewCompletionRun({
      cohortId: body.cohortId,
      trainingProgramId: body.trainingProgramId,
      assessmentAcademicTermId: body.assessmentAcademicTermId,
      evaluationMode: typeof body.evaluationMode === "string" ? body.evaluationMode : undefined,
    }));
  } catch (error) {
    return apiErrorResponse(error, "Completion preview failed");
  }
}
