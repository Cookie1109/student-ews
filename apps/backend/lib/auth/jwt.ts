import * as jose from "jose";
import type { Actor } from "./types";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export interface TokenPayload {
  sub: string;
  username: string;
  jti: string;
  roles: string[];
  scopes: string[];
  permissions: string[];
}

export async function signAccessToken(
  userId: string,
  username: string,
  actor: Actor,
  expiresIn = "15m"
): Promise<{ token: string; expiresAt: Date }> {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const roles = [...new Set(actor.grants.map((grant) => grant.role))];
  const scopes = [...new Set(actor.grants.map((grant) => grant.scope))];
  const permissions = [...new Set(actor.grants.map((grant) => grant.permission))];

  const token = await new jose.SignJWT({
    username,
    roles,
    scopes,
    permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());

  return { token, expiresAt };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    return {
      sub: payload.sub as string,
      username: (payload.username as string) || "",
      jti: (payload.jti as string) || "",
      roles: Array.isArray(payload.roles) ? payload.roles.filter((item): item is string => typeof item === "string") : [],
      scopes: Array.isArray(payload.scopes) ? payload.scopes.filter((item): item is string => typeof item === "string") : [],
      permissions: Array.isArray(payload.permissions)
        ? payload.permissions.filter((item): item is string => typeof item === "string")
        : [],
    };
  } catch {
    return null;
  }
}
