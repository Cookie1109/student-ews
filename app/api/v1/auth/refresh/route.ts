import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { readRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";

export async function POST(req: NextRequest) {
  try {
    const cookieToken = readRefreshToken(req);
    const body = cookieToken
      ? {}
      : await readJsonBody<{ refreshToken?: unknown }>(req, 16 * 1024);
    const candidate = cookieToken || body.refreshToken;
    const refreshToken = typeof candidate === "string" ? candidate : null;

    if (!refreshToken) {
      return errorResponse("Refresh token is required", "INVALID_REQUEST", 400);
    }

    const tokens = await AuthService.refresh(refreshToken);
    if (!tokens) {
      return errorResponse("Invalid or expired refresh token", "INVALID_TOKEN", 401);
    }

    const response = jsonResponse({ expiresAt: tokens.expiresAt });
    setAuthCookies(response, tokens);
    return response;
  } catch (err) {
    return apiErrorResponse(err, "Token refresh failed");
  }
}
