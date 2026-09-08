import { NextRequest } from "next/server";
import { TrainingProgramsService } from "@/lib/services/training-programs";
import { jsonResponse, errorResponse, parsePagination } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || searchParams.get("search") || undefined;
    const { page, pageSize } = parsePagination(searchParams);

    const result = await TrainingProgramsService.listCourses(search, page, pageSize);
    return jsonResponse(result);
  } catch (err) {
    console.error("List courses error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{ courseCode?: string; courseName?: string }>(req);
    if (!body.courseCode || !body.courseName) {
      return errorResponse("courseCode and courseName are required", "INVALID_REQUEST", 400);
    }
    return jsonResponse(await TrainingProgramsService.createCourse({
      courseCode: body.courseCode,
      courseName: body.courseName,
    }), 201);
  } catch (error) {
    return apiErrorResponse(error, "Failed to create course");
  }
}
