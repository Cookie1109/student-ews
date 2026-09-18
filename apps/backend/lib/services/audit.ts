import { prisma } from "@/lib/prisma";
import { getActorFromHeaders } from "@/lib/auth/get-actor";
import { isUUID } from "@/lib/utils/is-uuid";
import type { Prisma } from "@prisma/client";

export async function recordAudit(
  request: Request,
  event: {
    action: string;
    resourceType: string;
    resourceId?: string | null;
    details?: Prisma.InputJsonObject;
  },
) {
  const actor = await getActorFromHeaders(request);
  await prisma.auditLog.create({
    data: {
      actorId: actor?.userId || null,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId && isUUID(event.resourceId) ? event.resourceId : null,
      requestId: request.headers.get("x-request-id"),
      details: {
        ...(event.resourceId && !isUUID(event.resourceId) ? { sourceResourceId: event.resourceId } : {}),
        ...(event.details || {}),
      },
    },
  });
}
