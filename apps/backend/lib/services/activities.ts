import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/utils/api-error";

const STATUSES = new Set(["registered", "attended", "completed"]);

function requiredText(value: unknown, field: string, max: number) {
  if (typeof value !== "string" || !value.trim()) throw new ApiError(`${field} is required`, "INVALID_REQUEST", 400);
  const result = value.trim();
  if (result.length > max) throw new ApiError(`${field} is too long`, "INVALID_REQUEST", 400);
  return result;
}

function optionalText(value: unknown, max: number) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new ApiError("Invalid text value", "INVALID_REQUEST", 400);
  const result = value.trim();
  if (result.length > max) throw new ApiError("Text value is too long", "INVALID_REQUEST", 400);
  return result || null;
}

function optionalDate(value: unknown, field: string) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new ApiError(`${field} must be a date`, "INVALID_REQUEST", 400);
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new ApiError(`${field} must be a valid date`, "INVALID_REQUEST", 400);
  return date;
}

export type ActivityInput = {
  sourceCode?: unknown;
  name?: unknown;
  type?: unknown;
  organizingUnit?: unknown;
  academicTermId?: unknown;
  conductTermId?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  targetAudience?: unknown;
  description?: unknown;
};

function activityData(input: ActivityInput, partial = false): Prisma.ActivityUncheckedCreateInput | Prisma.ActivityUncheckedUpdateInput {
  const result: Record<string, unknown> = {};
  if (!partial || input.sourceCode !== undefined) result.sourceCode = requiredText(input.sourceCode, "sourceCode", 64);
  if (!partial || input.name !== undefined) result.name = requiredText(input.name, "name", 500);
  if (!partial || input.type !== undefined) result.type = requiredText(input.type, "type", 128);
  if (!partial || input.organizingUnit !== undefined) result.organizingUnit = optionalText(input.organizingUnit, 255);
  if (!partial || input.academicTermId !== undefined) result.academicTermId = optionalText(input.academicTermId, 36);
  if (!partial || input.conductTermId !== undefined) result.conductTermId = optionalText(input.conductTermId, 36);
  if (!partial || input.startDate !== undefined) result.startDate = optionalDate(input.startDate, "startDate");
  if (!partial || input.endDate !== undefined) result.endDate = optionalDate(input.endDate, "endDate");
  if (!partial || input.targetAudience !== undefined) result.targetAudience = optionalText(input.targetAudience, 255);
  if (!partial || input.description !== undefined) result.description = optionalText(input.description, 10000);
  const start = result.startDate as Date | null | undefined;
  const end = result.endDate as Date | null | undefined;
  if (start && end && end < start) throw new ApiError("endDate must not be before startDate", "INVALID_DATE_RANGE", 400);
  return result as Prisma.ActivityUncheckedCreateInput;
}

export class ActivitiesService {
  static async list(filters: { academicTermId?: string; type?: string; q?: string; page: number; pageSize: number }) {
    const where: Prisma.ActivityWhereInput = {
      ...(filters.academicTermId ? { academicTermId: filters.academicTermId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.q ? { OR: [
        { sourceCode: { contains: filters.q, mode: "insensitive" } },
        { name: { contains: filters.q, mode: "insensitive" } },
        { organizingUnit: { contains: filters.q, mode: "insensitive" } },
      ] } : {}),
    };
    const [total, items] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        include: { participations: { select: { status: true } } },
      }),
    ]);
    return {
      items: items.map(({ participations, ...item }) => ({
        ...item,
        participation: {
          total: participations.length,
          registered: participations.filter((p) => p.status === "registered").length,
          attended: participations.filter((p) => p.status === "attended").length,
          completed: participations.filter((p) => p.status === "completed").length,
        },
      })),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  static async get(id: string) {
    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new ApiError("Activity not found", "NOT_FOUND", 404);
    return activity;
  }

  static async create(input: ActivityInput, actorId: string | null) {
    const created = await prisma.activity.create({ data: activityData(input) as Prisma.ActivityUncheckedCreateInput });
    await prisma.auditLog.create({ data: {
      actorId,
      action: "activity.create",
      resourceType: "Activity",
      resourceId: created.id,
      details: { sourceCode: created.sourceCode, name: created.name },
    } });
    return created;
  }

  static async update(id: string, input: ActivityInput, actorId: string | null) {
    const data = activityData(input, true) as Prisma.ActivityUncheckedUpdateInput;
    if (!Object.keys(data).length) throw new ApiError("No fields to update", "INVALID_REQUEST", 400);
    const existing = await this.get(id);
    const effectiveStart = data.startDate instanceof Date ? data.startDate : existing.startDate;
    const effectiveEnd = data.endDate instanceof Date ? data.endDate : existing.endDate;
    if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
      throw new ApiError("endDate must not be before startDate", "INVALID_DATE_RANGE", 400);
    }
    const updated = await prisma.activity.update({ where: { id }, data });
    await prisma.auditLog.create({ data: {
      actorId,
      action: "activity.update",
      resourceType: "Activity",
      resourceId: updated.id,
      details: { changedFields: Object.keys(data) },
    } });
    return updated;
  }

  static async listParticipations(activityId: string, studentIds: string[] | null) {
    await this.get(activityId);
    const where: Prisma.ActivityParticipationWhereInput = {
      activityId,
      ...(studentIds ? { studentId: { in: studentIds } } : {}),
    };
    const rows = await prisma.activityParticipation.findMany({ where, orderBy: { createdAt: "desc" } });
    const students = rows.length ? await prisma.student.findMany({
      where: { id: { in: rows.map((row) => row.studentId) } },
      select: { id: true, sStudentId: true, sFullName: true, sClassStudentId: true },
    }) : [];
    const studentMap = new Map(students.map((student) => [student.id, student]));
    return rows.map((row) => ({ ...row, student: studentMap.get(row.studentId) || null }));
  }

  static async addParticipation(activityId: string, input: {
    studentId?: unknown; status?: unknown; evidence?: unknown; notes?: unknown;
  }, actorId: string | null) {
    await this.get(activityId);
    const studentId = requiredText(input.studentId, "studentId", 36);
    const status = input.status == null ? "registered" : requiredText(input.status, "status", 32);
    if (!STATUSES.has(status)) throw new ApiError("Invalid participation status", "INVALID_STATUS", 400);
    const student = await prisma.student.findFirst({ where: { id: studentId, deletedAt: null }, select: { id: true } });
    if (!student) throw new ApiError("Student not found", "INVALID_REFERENCE", 400);
    const existing = await prisma.activityParticipation.findUnique({
      where: { studentId_activityId: { studentId, activityId } },
      select: { id: true },
    });
    if (existing) throw new ApiError("Student already participates in this activity", "DUPLICATE_PARTICIPATION", 409);
    const verified = status === "completed";
    const created = await prisma.activityParticipation.create({ data: {
      activityId,
      studentId,
      status,
      evidence: optionalText(input.evidence, 500),
      notes: optionalText(input.notes, 10000),
      verifiedBy: verified ? actorId : null,
      verifiedAt: verified ? new Date() : null,
    } });
    await prisma.auditLog.create({ data: {
      actorId,
      action: "activity_participation.create",
      resourceType: "ActivityParticipation",
      resourceId: created.id,
      details: { activityId, studentId, status },
    } });
    return created;
  }

  static async updateParticipation(activityId: string, input: {
    studentId?: unknown; status?: unknown; evidence?: unknown; notes?: unknown;
  }, actorId: string | null) {
    const studentId = requiredText(input.studentId, "studentId", 36);
    const status = requiredText(input.status, "status", 32);
    if (!STATUSES.has(status)) throw new ApiError("Invalid participation status", "INVALID_STATUS", 400);
    const existing = await prisma.activityParticipation.findUnique({
      where: { studentId_activityId: { studentId, activityId } },
    });
    if (!existing) throw new ApiError("Participation not found", "NOT_FOUND", 404);
    const verified = status === "completed";
    const updated = await prisma.activityParticipation.update({
      where: { id: existing.id },
      data: {
        status,
        ...(input.evidence === undefined ? {} : { evidence: optionalText(input.evidence, 500) }),
        ...(input.notes === undefined ? {} : { notes: optionalText(input.notes, 10000) }),
        verifiedBy: verified ? actorId : null,
        verifiedAt: verified ? new Date() : null,
      },
    });
    await prisma.auditLog.create({ data: {
      actorId,
      action: "activity_participation.update",
      resourceType: "ActivityParticipation",
      resourceId: updated.id,
      details: { activityId, studentId, from: existing.status, to: status },
    } });
    return updated;
  }
}
