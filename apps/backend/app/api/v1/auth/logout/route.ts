import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth";
import { clearAuthCookies, readRefreshToken } from "@/lib/auth/cookies";
import { jsonResponse } from "@/lib/utils/api-response";
import { apiErrorResponse } from "@/lib/utils/api-error";

export async function POST(request: NextRequest) {
  try {
    await AuthService.revoke(readRefreshToken(request));
    const response = jsonResponse({ success: true });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    return apiErrorResponse(error, "Logout failed");
  }
}
