import { NextRequest } from "next/server";
import { DecisionsService } from "@/lib/services/decisions";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get("q") || "").trim().toLocaleLowerCase();
    const types = (await DecisionsService.listTypes()).filter((type) =>
      !q || String(type.id).includes(q) || type.name.toLocaleLowerCase().includes(q)
    );
    return jsonResponse({ items: types, total: types.length });
  } catch (err) {
    console.error("List decision types error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody<{
      id?: number;
      name?: string;
      decisionTypeId?: number;
      decisionName?: string;
      category?: string;
      isActive?: boolean;
    }>(request);
    const id = body.id ?? body.decisionTypeId;
    const name = body.name ?? body.decisionName;
    if (!Number.isInteger(id) || Number(id) < 1 || !name?.trim() || !body.category) {
      return errorResponse("id, name and category are required", "INVALID_REQUEST", 400);
    }
    return jsonResponse(await DecisionsService.createType({
      decisionTypeId: id,
      decisionName: name,
      category: body.category,
      isActive: body.isActive,
    }), 201);
  } catch (error) {
    return apiErrorResponse(error, "Failed to create decision type");
  }
}
