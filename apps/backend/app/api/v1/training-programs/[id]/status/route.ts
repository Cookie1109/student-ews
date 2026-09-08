import { NextRequest } from "next/server";
import { TrainingProgramsService } from "@/lib/services/training-programs";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await readJsonBody<{ status?: unknown }>(request);
    if (typeof body.status !== "string") {
      return errorResponse("status is required", "VALIDATION_ERROR", 422);
    }
    return jsonResponse(await TrainingProgramsService.setProgramStatus(id, body.status));
  } catch (error) {
    return apiErrorResponse(error, "Failed to update training-program status");
  }
}
