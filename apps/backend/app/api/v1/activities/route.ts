import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { ActivitiesService, type ActivityInput } from "@/lib/services/activities";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { jsonResponse, parsePagination } from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission("activity.read", req);
    if (!auth.authorized) return auth.response;
    const { page, pageSize } = parsePagination(req.nextUrl.searchParams);
    return jsonResponse(await ActivitiesService.list({
      page,
      pageSize,
      academicTermId: req.nextUrl.searchParams.get("academicTermId") || undefined,
      type: req.nextUrl.searchParams.get("type") || undefined,
      q: req.nextUrl.searchParams.get("q") || undefined,
    }));
  } catch (error) {
    return apiErrorResponse(error, "Failed to list activities");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission("activity.manage", req);
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<ActivityInput>(req);
    return jsonResponse(await ActivitiesService.create(body, auth.actor.userId), 201);
  } catch (error) {
    return apiErrorResponse(error, "Failed to create activity");
  }
}
