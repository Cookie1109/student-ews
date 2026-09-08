import { NextRequest } from "next/server";
import { DecisionsService } from "@/lib/services/decisions";
import { jsonResponse, errorResponse, parsePagination } from "@/lib/utils/api-response";
import { requireStudentPermission } from "@/lib/auth/data-scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireStudentPermission(req, id, "decision.read");
    if (!auth.authorized) return auth.response;
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize } = parsePagination(searchParams);
    const q = (searchParams.get("q") || "").trim().toLocaleLowerCase();
    const academicYear = searchParams.get("academicYear") || "";
    const termCode = (searchParams.get("termCode") || "").toUpperCase();
    const decisionTypeId = Number(searchParams.get("decisionTypeId") || 0);
    const warning = searchParams.get("isAcademicWarning");
    const allItems = (await DecisionsService.list(id)).filter((item) =>
      (!academicYear || item.yearStudy === academicYear) &&
      (!termCode || item.termId?.toUpperCase() === termCode) &&
      (!decisionTypeId || item.decisionTypeId === decisionTypeId) &&
      (warning === null || item.isAcademicWarning === (warning === "true")) &&
      (!q || [item.decisionNumber, item.decisionName, item.reason, item.fullText]
        .some((value) => value?.toLocaleLowerCase().includes(q)))
    );
    const offset = (page - 1) * pageSize;
    return jsonResponse({ items: allItems.slice(offset, offset + pageSize), total: allItems.length, page, pageSize });
  } catch (err) {
    console.error("List decisions error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireStudentPermission(req, id, "decision.create");
    if (!auth.authorized) return auth.response;
    const body = await req.json();
    if (!body.decisionTypeId) {
      return errorResponse("decisionTypeId is required", "INVALID_REQUEST", 400);
    }
    const created = await DecisionsService.create(id, body);
    return jsonResponse(created, 201);
  } catch (err) {
    console.error("Create decision error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
