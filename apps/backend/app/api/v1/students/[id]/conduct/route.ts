import { NextRequest } from "next/server";
import { requireStudentPermission } from "@/lib/auth/data-scope";
import { ConductService } from "@/lib/services/conduct";
import { apiErrorResponse } from "@/lib/utils/api-error";
import { jsonResponse } from "@/lib/utils/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireStudentPermission(req, id, "student.read");
    if (!auth.authorized) return auth.response;
    return jsonResponse(await ConductService.listForStudent(id));
  } catch (error) {
    return apiErrorResponse(error, "Failed to load conduct records");
  }
}
