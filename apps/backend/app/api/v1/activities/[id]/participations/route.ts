import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/authorize";
import { requireStudentPermission, studentScopeWhere } from "@/lib/auth/data-scope";
import { prisma } from "@/lib/prisma";
import { ActivitiesService } from "@/lib/services/activities";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";
import { isUUID } from "@/lib/utils/is-uuid";

type Params = { params: Promise<{ id: string }> };
type ParticipationBody = { studentId?: unknown; status?: unknown; evidence?: unknown; notes?: unknown };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return errorResponse("Invalid activity id", "INVALID_ID", 400);
    const auth = await requirePermission("activity.read", req);
    if (!auth.authorized) return auth.response;
    const visibleStudents = await prisma.student.findMany({
      where: { AND: [{ deletedAt: null }, await studentScopeWhere(auth.actor)] },
      select: { id: true },
    });
    return jsonResponse({
      items: await ActivitiesService.listParticipations(id, visibleStudents.map((student) => student.id)),
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to list activity participations");
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return errorResponse("Invalid activity id", "INVALID_ID", 400);
    const auth = await requirePermission("activity.manage", req);
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<ParticipationBody>(req);
    if (typeof body.studentId !== "string") return errorResponse("studentId is required", "INVALID_REQUEST", 400);
    const studentAuth = await requireStudentPermission(req, body.studentId, "activity.manage");
    if (!studentAuth.authorized) return studentAuth.response;
    return jsonResponse(await ActivitiesService.addParticipation(id, body, auth.actor.userId), 201);
  } catch (error) {
    return apiErrorResponse(error, "Failed to add activity participation");
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return errorResponse("Invalid activity id", "INVALID_ID", 400);
    const auth = await requirePermission("activity.manage", req);
    if (!auth.authorized) return auth.response;
    const body = await readJsonBody<ParticipationBody>(req);
    if (typeof body.studentId !== "string") return errorResponse("studentId is required", "INVALID_REQUEST", 400);
    const studentAuth = await requireStudentPermission(req, body.studentId, "activity.manage");
    if (!studentAuth.authorized) return studentAuth.response;
    return jsonResponse(await ActivitiesService.updateParticipation(id, body, auth.actor.userId));
  } catch (error) {
    return apiErrorResponse(error, "Failed to update activity participation");
  }
}
