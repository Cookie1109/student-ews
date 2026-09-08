import { NextRequest } from "next/server";
import { StudentsService } from "@/lib/services/students";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { requirePermission } from "@/lib/auth/authorize";
import { studentScopeWhere } from "@/lib/auth/data-scope";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission("student.export", req);
    if (!auth.authorized) return auth.response;
    const students = await StudentsService.exportAll(await studentScopeWhere(auth.actor));
    return jsonResponse(students);
  } catch (err) {
    console.error("Export students error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
