import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth";
import { jsonResponse, errorResponse } from "@/lib/utils/api-response";
import { setAuthCookies } from "@/lib/auth/cookies";
import { apiErrorResponse, readJsonBody } from "@/lib/utils/api-error";
import { checkLoginAttempt, clearLoginFailures, loginAttemptKey, recordLoginFailure } from "@/lib/auth/login-rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{ username?: unknown; password?: unknown }>(req, 16 * 1024);
    const { username, password } = body;

    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      return errorResponse("Username and password are required", "INVALID_REQUEST", 400);
    }

    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const key = loginAttemptKey(forwardedFor || "unknown", username);
    const limit = checkLoginAttempt(key);
    if (!limit.allowed) {
      const response = errorResponse("Too many failed login attempts", "RATE_LIMITED", 429);
      response.headers.set("Retry-After", String(limit.retryAfterSeconds));
      return response;
    }

    const result = await AuthService.login(username, password);
    if (!result) {
      recordLoginFailure(key);
      return errorResponse("Invalid credentials or inactive account", "INVALID_CREDENTIALS", 401);
    }

    clearLoginFailures(key);

    const response = jsonResponse({ user: result.user, actor: result.actor });
    setAuthCookies(response, result.tokens);
    return response;
  } catch (err) {
    return apiErrorResponse(err, "Login failed");
  }
}
