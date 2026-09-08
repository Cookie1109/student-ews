import { NextRequest } from "next/server";
import { TrainingProgressService } from "@/lib/services/training-progress";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { planClassScope, requirePlanPermission } from "@/lib/auth/data-scope";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requirePlanPermission(req, id, "progress.read");
    if (!auth.authorized) return auth.response;
    const plan = await TrainingProgressService.getPlanById(id, await planClassScope(auth.actor, id));
    if (!plan) return errorResponse("Plan not found", "NOT_FOUND", 404);
    return jsonResponse(plan);
  } catch (e) {
    return apiErrorResponse(e, "Failed to load progress plan");
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requirePlanPermission(req, id, "progress.plan.manage");
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<Record<string, any>>(req, 2 * 1024 * 1024);
    const plan = await TrainingProgressService.updatePlan(id, body);
    return jsonResponse(plan);
  } catch (e) {
    if (e instanceof Error && e.message === "Plan not found") return errorResponse("Plan not found", "NOT_FOUND", 404);
    if (e instanceof Error && e.message.includes("draft")) return errorResponse("Only draft plans can be updated", "INVALID_STATE", 422);
    return apiErrorResponse(e, "Failed to update progress plan");
  }
}
