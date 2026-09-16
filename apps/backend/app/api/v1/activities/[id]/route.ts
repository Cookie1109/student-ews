import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { ActivitiesService, type ActivityInput } from "@/lib/services/activities";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";
import { isUUID } from "@/lib/utils/is-uuid";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return errorResponse("Invalid activity id", "INVALID_ID", 400);
    const auth = await requirePermission("activity.read", req);
    if (!auth.authorized) return auth.response;
    return jsonResponse(await ActivitiesService.get(id));
  } catch (error) {
    return apiErrorResponse(error, "Failed to load activity");
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return errorResponse("Invalid activity id", "INVALID_ID", 400);
    const auth = await requirePermission("activity.manage", req);
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<ActivityInput>(req);
    return jsonResponse(await ActivitiesService.update(id, body, auth.actor.userId));
  } catch (error) {
    return apiErrorResponse(error, "Failed to update activity");
  }
}

export const PATCH = PUT;
