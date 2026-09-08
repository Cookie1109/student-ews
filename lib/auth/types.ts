export interface Grant {
  role: string;
  scope: string;
  permission: string;
}

export interface Actor {
  userId: string;
  username: string;
  fullName: string;
  grants: Grant[];
}

export function hasScope(actor: Actor, scope: string): boolean {
  for (const g of actor.grants) {
    if (g.scope === "system" || g.scope === scope) {
      return true;
    }
  }
  return false;
}

export function hasPermission(actor: Actor, permission: string): boolean {
  for (const g of actor.grants) {
    if (g.permission === permission || g.role === "admin") {
      return true;
    }
  }
  return false;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
