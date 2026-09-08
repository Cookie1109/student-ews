import { prisma } from "@/lib/prisma";
import { isUUID, studentIdWhere } from "@/lib/utils/is-uuid";
import { ApiError } from "@/lib/utils/api-error";
import { Prisma } from "@prisma/client";

export class FeePoliciesService {
  static async listTypes() {
    return prisma.feePolicyType.findMany({
      where: { deletedAt: null },
      orderBy: { feeObjectDicId: "asc" },
    });
  }

  static async createType(data: { feeObjectDicId: string; feeObjectDicName: string; isActive?: boolean }) {
    return prisma.feePolicyType.create({
      data: {
        feeObjectDicId: data.feeObjectDicId.trim(),
        feeObjectDicName: data.feeObjectDicName.trim(),
        isActive: data.isActive ?? true,
      },
    });
  }

  static async updateType(id: string, data: { feeObjectDicName?: string; isActive?: boolean }) {
    return prisma.feePolicyType.update({
      where: { feeObjectDicId: id },
      data: {
        ...(data.feeObjectDicName !== undefined ? { feeObjectDicName: data.feeObjectDicName.trim() } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  static async removeType(id: string) {
    return prisma.feePolicyType.update({
      where: { feeObjectDicId: id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  static async list(studentId: string) {
    const student = await prisma.student.findFirst({
      where: {
        ...studentIdWhere(studentId),
        deletedAt: null,
      },
    });

    if (!student) return [];

    const policies = await prisma.studentFeePolicy.findMany({
      where: { studentId: student.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return policies.map((p) => ({
      id: p.id,
      studentId: p.studentId,
      feeObjectDicId: p.feeObjectDicId,
      policyName: p.sFeeObjectDicName,
      coefficientPercent: Number(p.coefficientPercent),
      decisionNumber: p.sDecisionNumber,
      yearStudy: p.sYearStudy,
      termId: p.sTermId,
      createdAt: p.createdAt,
    }));
  }

  static async getById(feePolicyId: string, studentIdentifier?: string) {
    const policy = await prisma.studentFeePolicy.findUnique({
      where: { id: feePolicyId },
    });

    if (!policy) return null;
    if (studentIdentifier) {
      const owner = await prisma.student.findFirst({
        where: { ...studentIdWhere(studentIdentifier), deletedAt: null },
        select: { id: true },
      });
      if (!owner || owner.id !== policy.studentId) return null;
    }

    return {
      id: policy.id,
      studentId: policy.studentId,
      feeObjectDicId: policy.feeObjectDicId,
      policyName: policy.sFeeObjectDicName,
      coefficientPercent: Number(policy.coefficientPercent),
      decisionNumber: policy.sDecisionNumber,
      yearStudy: policy.sYearStudy,
      termId: policy.sTermId,
      createdAt: policy.createdAt,
    };
  }

  static async create(studentId: string, data: any) {
    const student = await prisma.student.findFirst({
      where: {
        ...studentIdWhere(studentId),
        deletedAt: null,
      },
    });

    if (!student) throw new Error("Student not found");

    const term = await prisma.academicTerm.findFirst({
      where: { deletedAt: null },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }],
    });
    if (!term) throw new Error("Academic term not found");
    const year = await prisma.academicYear.findUnique({ where: { id: term.academicYearId } });

    const created = await prisma.studentFeePolicy.create({
      data: {
        studentId: student.id,
        academicYearId: term.academicYearId,
        academicTermId: term.id,
        feeObjectDicId: data.feeObjectDicId || "DEFAULT",
        sStudentId: student.sStudentId,
        sFeeObjectId: uniqueSourceId(),
        sYearStudy: data.yearStudy || year?.sYearCode || "",
        sTermId: data.termId || term.sTermCode,
        sFeeObjectDicName: data.policyName || data.feeObjectDicName || "Chính sách học phí",
        sCoefficient: data.coefficient || "1.0",
        coefficientPercent: data.reductionPercent !== undefined ? Number(data.reductionPercent) : 50,
        sDecisionNumber: data.decisionNumber || "",
      },
    });

    return this.getById(created.id);
  }

  static async update(studentIdentifier: string, feePolicyId: string, data: any) {
    const existing = await this.getById(feePolicyId, studentIdentifier);
    if (!existing) throw new ApiError("Fee policy not found for student", "NOT_FOUND", 404);
    const updateData: any = {};
    if (data.feeObjectDicId) updateData.feeObjectDicId = data.feeObjectDicId;
    if (data.policyName) updateData.sFeeObjectDicName = data.policyName;
    if (data.reductionPercent !== undefined) updateData.coefficientPercent = Number(data.reductionPercent);
    if (data.decisionNumber) updateData.sDecisionNumber = data.decisionNumber;

    const updated = await prisma.studentFeePolicy.update({
      where: { id: feePolicyId },
      data: updateData,
    });

    return this.getById(updated.id);
  }

  static async delete(studentIdentifier: string, feePolicyId: string) {
    const existing = await this.getById(feePolicyId, studentIdentifier);
    if (!existing) throw new ApiError("Fee policy not found for student", "NOT_FOUND", 404);
    await prisma.studentFeePolicy.update({
      where: { id: feePolicyId },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  static async importFeePolicies(items: any[], studentScope: Prisma.StudentWhereInput = {}) {
    const errors: string[] = [];
    const term = await prisma.academicTerm.findFirst({
      where: { deletedAt: null },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }],
    });
    if (!term) throw new Error("Academic term not found");
    const year = await prisma.academicYear.findUnique({ where: { id: term.academicYearId } });
    const identifiers = [...new Set(items.map((item) => String(item?.studentId || "").trim()).filter(Boolean))];
    const uuidIds = identifiers.filter(isUUID);
    const students = await prisma.student.findMany({
      where: { AND: [{ deletedAt: null, OR: [{ sStudentId: { in: identifiers } }, { id: { in: uuidIds } }] }, studentScope] },
      select: { id: true, sStudentId: true },
    });
    const studentMap = new Map(students.flatMap((student) => [[student.id, student], [student.sStudentId, student]]));
    const requestedTypeIds = [...new Set(items.map((item) => String(item?.feeObjectDicId || "DEFAULT").trim()))];
    const validTypes = new Map((await prisma.feePolicyType.findMany({
      where: { feeObjectDicId: { in: requestedTypeIds }, deletedAt: null, isActive: true },
      select: { feeObjectDicId: true, feeObjectDicName: true },
    })).map((type) => [type.feeObjectDicId, type]));
    const existing = await prisma.studentFeePolicy.findMany({
      where: { studentId: { in: students.map((student) => student.id) }, academicTermId: term.id, deletedAt: null },
      select: { studentId: true, feeObjectDicId: true, sDecisionNumber: true },
    });
    const naturalKey = (studentId: string, typeId: string, number: string) => `${studentId}|${typeId}|${number.trim()}`;
    const seen = new Set(existing.map((item) => naturalKey(item.studentId, item.feeObjectDicId, item.sDecisionNumber)));
    const rows: Prisma.StudentFeePolicyCreateManyInput[] = [];

    items.forEach((item, index) => {
      const identifier = String(item?.studentId || "").trim();
      const student = studentMap.get(identifier);
      const typeId = String(item?.feeObjectDicId || "DEFAULT").trim();
      const type = validTypes.get(typeId);
      const decisionNumber = String(item?.decisionNumber || "").trim();
      const percent = item?.reductionPercent === undefined ? 50 : Number(item.reductionPercent);
      if (!student) return errors.push(`Row ${index + 1}: student not found (${identifier || "missing studentId"})`);
      if (!type) return errors.push(`Row ${index + 1}: invalid feeObjectDicId`);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) return errors.push(`Row ${index + 1}: reductionPercent must be between 0 and 100`);
      const key = naturalKey(student.id, typeId, decisionNumber);
      if (seen.has(key)) return errors.push(`Row ${index + 1}: duplicate fee policy skipped`);
      seen.add(key);
      rows.push({
        studentId: student.id,
        academicYearId: term.academicYearId,
        academicTermId: term.id,
        feeObjectDicId: typeId,
        sStudentId: student.sStudentId,
        sFeeObjectId: uniqueSourceId(),
        sYearStudy: String(item.yearStudy || year?.sYearCode || ""),
        sTermId: String(item.termId || term.sTermCode),
        sFeeObjectDicName: String(item.policyName || item.feeObjectDicName || type.feeObjectDicName),
        sCoefficient: "1.0",
        coefficientPercent: percent,
        sDecisionNumber: decisionNumber,
      });
    });
    let imported = 0;
    if (rows.length) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`fee-policy-import:${term.id}`}))`;
        const concurrentExisting = await tx.studentFeePolicy.findMany({
          where: { studentId: { in: students.map((student) => student.id) }, academicTermId: term.id, deletedAt: null },
          select: { studentId: true, feeObjectDicId: true, sDecisionNumber: true },
        });
        const concurrentKeys = new Set(concurrentExisting.map((item) => naturalKey(item.studentId, item.feeObjectDicId, item.sDecisionNumber)));
        const freshRows = rows.filter((row) => !concurrentKeys.has(naturalKey(row.studentId, row.feeObjectDicId, row.sDecisionNumber)));
        if (freshRows.length) await tx.studentFeePolicy.createMany({ data: freshRows });
        imported = freshRows.length;
      });
    }
    return { imported, skipped: items.length - imported, total: items.length, errors };
  }
}

function uniqueSourceId(): bigint {
  const timePart = BigInt(Date.now()) * BigInt(1_000_000);
  const randomPart = BigInt(Math.floor(Math.random() * 1_000_000));
  return timePart + randomPart;
}
