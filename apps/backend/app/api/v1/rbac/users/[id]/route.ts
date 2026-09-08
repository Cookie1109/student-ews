import { NextRequest } from "next/server";
import { RbacService } from "@/lib/services/rbac";
import { jsonResponse } from "@/lib/utils/api-response";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJsonBody<{
      fullName?: string;
      email?: string;
      isActive?: boolean;
      roleCodes?: string[];
      password?: string;
    }>(req);

    const updated = await RbacService.updateUser(id, body);
    return jsonResponse(updated);
  } catch (err: unknown) {
    return apiErrorResponse(err, "Failed to update user");
  }
}

export const PATCH = PUT;
