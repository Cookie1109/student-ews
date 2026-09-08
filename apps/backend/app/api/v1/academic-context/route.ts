import { TrainingProgramsService } from "@/lib/services/training-programs";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const context = await TrainingProgramsService.getCurrentAcademicContext();
    return jsonResponse(context);
  } catch (err) {
    console.error("Academic context error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
