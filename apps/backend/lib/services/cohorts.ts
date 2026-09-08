import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/utils/api-error";
import { Prisma, type Cohort } from "@prisma/client";

function mapCohort(cohort: Cohort) {
  return {
    id: cohort.id,
    cohortCode: cohort.sCohortCode,
    cohortName: cohort.sCohortName,
    createdAt: cohort.createdAt,
    updatedAt: cohort.updatedAt,
  };
}

export class CohortsService {
  static async list(search = "", page = 1, pageSize = 20) {
    const query = search.trim();
    const where: Prisma.CohortWhereInput = {
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { sCohortCode: { contains: query, mode: "insensitive" } },
              { sCohortName: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [total, cohorts] = await Promise.all([
      prisma.cohort.count({ where }),
      prisma.cohort.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ sCohortName: "asc" }, { sCohortCode: "asc" }],
      }),
    ]);
    const classes = await prisma.class.findMany({
      where: { cohortId: { in: cohorts.map((cohort) => cohort.id) }, deletedAt: null },
    });

    const classesByCohort: Record<string, Array<{ id: string; classId: string; className: string }>> = {};
    for (const cls of classes) {
      if (cls.cohortId) {
        if (!classesByCohort[cls.cohortId]) classesByCohort[cls.cohortId] = [];
        classesByCohort[cls.cohortId].push({
          id: cls.id,
          classId: cls.classId,
          className: cls.className,
        });
      }
    }

    const items = cohorts.map((c) => ({
      id: c.id,
      cohortCode: c.sCohortCode,
      cohortName: c.sCohortName,
      classes: classesByCohort[c.id] || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    return { items, total, page, pageSize };
  }

  static async create(data: { cohortCode: string; cohortName: string }) {
    const created = await prisma.cohort.create({
      data: { sCohortCode: data.cohortCode.trim(), sCohortName: data.cohortName.trim(), isActive: true },
    });
    return mapCohort(created);
  }

  static async getById(id: string) {
    const cohort = await prisma.cohort.findFirst({ where: { id, deletedAt: null } });
    if (!cohort) return null;
    const classes = await prisma.class.findMany({
      where: { cohortId: cohort.id, deletedAt: null },
      orderBy: { classId: "asc" },
    });
    return {
      id: cohort.id,
      cohortCode: cohort.sCohortCode,
      cohortName: cohort.sCohortName,
      isActive: cohort.isActive,
      classes: classes.map((item) => ({ id: item.id, classId: item.classId, className: item.className })),
      createdAt: cohort.createdAt,
      updatedAt: cohort.updatedAt,
    };
  }

  static async update(id: string, data: { cohortCode?: string; cohortName?: string; isActive?: boolean }) {
    const existing = await prisma.cohort.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new ApiError("Cohort not found", "NOT_FOUND", 404);
    const updated = await prisma.cohort.update({
      where: { id },
      data: {
        ...(data.cohortCode !== undefined ? { sCohortCode: data.cohortCode.trim() } : {}),
        ...(data.cohortName !== undefined ? { sCohortName: data.cohortName.trim() } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return mapCohort(updated);
  }

  static async remove(id: string) {
    return prisma.cohort.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}
