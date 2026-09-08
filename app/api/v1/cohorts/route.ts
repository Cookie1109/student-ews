import { NextRequest } from "next/server";
import { CohortsService } from "@/lib/services/cohorts";
import { jsonResponse, errorResponse, parsePagination } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize } = parsePagination(searchParams);
    return jsonResponse(await CohortsService.list(searchParams.get("q") || "", page, pageSize));
  } catch (err) {
    console.error("List cohorts error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{ cohortCode?: string; cohortName?: string }>(req);
    if (!body.cohortCode || !body.cohortName) {
      return errorResponse("cohortCode and cohortName are required", "INVALID_REQUEST", 400);
    }
    return jsonResponse(await CohortsService.create({ cohortCode: body.cohortCode, cohortName: body.cohortName }), 201);
  } catch (error) {
    return apiErrorResponse(error, "Failed to create cohort");
  }
}
