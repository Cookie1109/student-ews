import { NextRequest } from "next/server";
import { CohortsService } from "@/lib/services/cohorts";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { errorResponse, jsonResponse } from "@/lib/utils/api-response";

interface Params { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const cohort = await CohortsService.getById(id);
    if (!cohort) return errorResponse("Cohort not found", "NOT_FOUND", 404);
    return jsonResponse(cohort);
  } catch (error) {
    return apiErrorResponse(error, "Failed to load cohort");
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJsonBody<{ cohortCode?: string; cohortName?: string; isActive?: boolean }>(request);
    return jsonResponse(await CohortsService.update(id, body));
  } catch (error) {
    return apiErrorResponse(error, "Failed to update cohort");
  }
}

export const PATCH = PUT;

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await CohortsService.remove(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete cohort");
  }
}
