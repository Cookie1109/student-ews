import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse, parsePagination } from "@/lib/utils/api-response";
import { completionRunScopeWhere, requireProgressScopePermission, runClassScopes } from "@/lib/auth/data-scope";
import { requirePermission } from "@/lib/auth/authorize";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission("progress.read", req);
    if (!auth.authorized) return auth.response;
    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get("cohortId") || undefined;
    const programId = searchParams.get("trainingProgramId") || undefined;
    const termId = searchParams.get("assessmentAcademicTermId") || searchParams.get("termId") || undefined;
    const publicationStatus = searchParams.get("publicationStatus") || undefined;
    const evaluationMode = searchParams.get("evaluationMode") || "standard";
    const { page, pageSize } = parsePagination(searchParams);

    const result = await TrainingProgressService.listCompletionRuns(
      cohortId,
      programId,
      termId,
      publicationStatus,
      evaluationMode,
      page,
      pageSize,
      await completionRunScopeWhere(auth.actor),
    );
    result.items = await TrainingProgressService.scopeCompletionRunItems(result.items, await runClassScopes(
      auth.actor,
      result.items.map((item) => ({
        id: item.id,
        academicTermId: item.assessmentAcademicTermId,
        cohortId: item.cohortId,
        trainingProgramId: item.trainingProgramId,
      })),
    ));
    return jsonResponse(result);
  } catch (err) {
    console.error("List completion runs error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{
      cohortId?: string;
      trainingProgramId?: string;
      assessmentAcademicTermId?: string;
      evaluationMode?: string;
    }>(req, 256 * 1024);
    if (!body.cohortId || !body.trainingProgramId || !body.assessmentAcademicTermId) {
      return errorResponse("cohortId, trainingProgramId, and assessmentAcademicTermId are required", "INVALID_REQUEST", 400);
    }
    const auth = await requireProgressScopePermission(req, {
      cohortId: body.cohortId,
      trainingProgramId: body.trainingProgramId,
      academicTermId: body.assessmentAcademicTermId,
    }, "progress.calculate");
    if (!auth.authorized) return auth.response;
    const run = await TrainingProgressService.triggerCompletionRun({
      cohortId: body.cohortId,
      trainingProgramId: body.trainingProgramId,
      assessmentAcademicTermId: body.assessmentAcademicTermId,
      evaluationMode: body.evaluationMode,
    });
    return jsonResponse(run, 201);
  } catch (err) {
    return apiErrorResponse(err, "Completion calculation failed");
  }
}
