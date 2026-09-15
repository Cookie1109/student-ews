import { NextRequest } from "next/server";
import { requireStudentPermission, requireWarningRunPermission } from "@/lib/auth/data-scope";
import { prisma } from "@/lib/prisma";
import { WarningActionsService } from "@/lib/services/warning-actions";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";
import { isUUID } from "@/lib/utils/is-uuid";
import { requirePermission } from "@/lib/auth/authorize";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return errorResponse("Invalid warning action id", "INVALID_ID", 400);
    const auth = await requirePermission("academic_warning.action.update", req);
    if (!auth.authorized) return auth.response;
    const existing = await prisma.warningAction.findUnique({
      where: { id },
      select: { studentId: true, runId: true },
    });
    if (!existing) return errorResponse("Warning action not found", "NOT_FOUND", 404);

    const studentAuth = await requireStudentPermission(req, existing.studentId, "academic_warning.action.update");
    if (!studentAuth.authorized) return studentAuth.response;
    if (existing.runId) {
      const runAuth = await requireWarningRunPermission(req, existing.runId, "academic_warning.action.update");
      if (!runAuth.authorized) return runAuth.response;
    }

    const body = await readJsonBody<{
      status?: string;
      assignedUserId?: string | null;
      dueDate?: string | null;
      note?: string;
    }>(req, 256 * 1024);
    const updated = await WarningActionsService.update(id, body, studentAuth.actor);
    return jsonResponse(updated);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update warning action");
  }
}

export const PUT = PATCH;
