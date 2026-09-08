import { headers } from "next/headers";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "./jwt";
import { ACCESS_TOKEN_COOKIE } from "./cookies";
import type { Actor, Grant } from "./types";

export async function getActorFromHeaders(request?: Request): Promise<Actor | null> {
  const headersList = request?.headers ?? (await headers());
  const authHeader = headersList.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;
  const cookieToken = request
    ? readCookieHeader(headersList.get("cookie"), ACCESS_TOKEN_COOKIE)
    : (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const token = bearerToken || cookieToken;
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload || !payload.sub) return null;

  return getActorById(payload.sub);
}

function readCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) return decodeURIComponent(valueParts.join("="));
  }
  return null;
}

export async function getActorById(userId: string): Promise<Actor | null> {
  try {
    const rows: Array<{
      id: string;
      username: string;
      full_name: string;
      role_code: string | null;
      data_scope: string | null;
      permission_code: string | null;
    }> = await prisma.$queryRaw`
      SELECT user_record.id::text, user_record.username, user_record.full_name,
             role.code AS role_code, role.data_scope, permission.code AS permission_code
      FROM users user_record
      LEFT JOIN user_roles user_role ON user_role.user_id = user_record.id
      LEFT JOIN roles role ON role.id = user_role.role_id AND role.is_active = true AND role.deleted_at IS NULL
      LEFT JOIN role_permissions role_permission ON role_permission.role_id = role.id
      LEFT JOIN permissions permission ON permission.id = role_permission.permission_id
      WHERE user_record.id = ${userId}::uuid
        AND user_record.deleted_at IS NULL
        AND user_record.is_active = true
      ORDER BY role.code, permission.code
    `;
    if (!rows.length) return null;
    const grants: Grant[] = rows
      .filter((row) => row.role_code && row.data_scope && row.permission_code)
      .map((row) => ({ role: row.role_code!, scope: row.data_scope!, permission: row.permission_code! }));
    const user = rows[0];

    return {
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      grants,
    };
  } catch (err) {
    console.error("Error retrieving actor:", err);
    return null;
  }
}
