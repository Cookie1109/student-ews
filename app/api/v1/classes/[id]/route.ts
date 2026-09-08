import { NextRequest } from "next/server";
import { ClassesService } from "@/lib/services/classes";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";

interface Params { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await ClassesService.getById(id);
    if (!result) return errorResponse("Class not found", "NOT_FOUND", 404);
    return jsonResponse(result);
  } catch (error) {
    return apiErrorResponse(error, "Failed to load class");
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJsonBody<{ classId?: string; className?: string; cohortId?: string | null; isActive?: boolean }>(request);
    return jsonResponse(await ClassesService.update(id, body));
  } catch (error) {
    return apiErrorResponse(error, "Failed to update class");
  }
}

export const PATCH = PUT;

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await ClassesService.remove(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete class");
  }
}
