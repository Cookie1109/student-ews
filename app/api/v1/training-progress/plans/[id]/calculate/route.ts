import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requirePlanPermission } from "@/lib/auth/data-scope";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requirePlanPermission(req, id, "progress.calculate");
    if (!auth.authorized) return auth.response;
    const run = await TrainingProgressService.triggerCalculate(id);
    return jsonResponse(run, 201);
  } catch (err: unknown) {
    console.error("Calculate progress error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, "CALCULATION_ERROR", 500);
  }
}
