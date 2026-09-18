import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/utils/api-error";
import { studentIdWhere } from "@/lib/utils/is-uuid";

export type ConductClassification = "Xuất sắc" | "Tốt" | "Khá" | "Trung bình" | "Yếu" | "Kém";

export function classifyConductScore(score: number): ConductClassification {
  if (score >= 90) return "Xuất sắc";
  if (score >= 80) return "Tốt";
  if (score >= 65) return "Khá";
  if (score >= 50) return "Trung bình";
  if (score >= 35) return "Yếu";
  return "Kém";
}

export function conductApproval(statusId: string | null, lastScore: unknown) {
  if (statusId === "1" && lastScore != null) return { code: "approved", label: "Đã công nhận" };
  if (statusId === "0") return { code: "pending", label: "Chờ đánh giá" };
  return { code: "unknown", label: "Chưa xác định" };
}

export function isSummerConductTerm(termCode: string | null | undefined, sourceFlag = false) {
  return sourceFlag || termCode?.trim().toUpperCase() === "HK03";
}

function numberOrNull(value: unknown) {
  return value == null ? null : Number(value);
}

function serialize(record: {
  id: string;
  academicYearId: string;
  academicTermId: string;
  sClassStudentId: string | null;
  studentScore: unknown;
  classScore: unknown;
  departmentScore: unknown;
  statusId: string | null;
  lastScore: unknown;
  sourceUpdateDay: string | null;
  sourceUpdateStaff: string | null;
  createdAt: Date;
  updatedAt: Date;
}, period?: { yearCode: string; termCode: string; termName: string; isSummer: boolean }) {
  const recognizedScore = record.statusId === "1" ? numberOrNull(record.lastScore) : null;
  return {
    id: record.id,
    academicYearId: record.academicYearId,
    academicTermId: record.academicTermId,
    academicYear: period?.yearCode || null,
    termCode: period?.termCode || null,
    termName: period?.termName || null,
    isSummer: isSummerConductTerm(period?.termCode, period?.isSummer),
    classCode: record.sClassStudentId,
    scores: {
      self: numberOrNull(record.studentScore),
      class: numberOrNull(record.classScore),
      department: numberOrNull(record.departmentScore),
      recognized: recognizedScore,
    },
    approval: conductApproval(record.statusId, record.lastScore),
    classification: recognizedScore == null ? null : classifyConductScore(recognizedScore),
    sourceStatusId: record.statusId,
    sourceUpdatedAt: record.sourceUpdateDay,
    sourceUpdatedBy: record.sourceUpdateStaff,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class ConductService {
  static async listForStudent(studentIdentifier: string) {
    const student = await prisma.student.findFirst({
      where: { ...studentIdWhere(studentIdentifier), deletedAt: null },
      select: { id: true, sStudentId: true, sFullName: true },
    });
    if (!student) throw new ApiError("Student not found", "NOT_FOUND", 404);

    const records = await prisma.studentConductRecord.findMany({
      where: { studentId: student.id },
      orderBy: [{ academicYearId: "asc" }, { academicTermId: "asc" }],
    });
    const termIds = [...new Set(records.map((record) => record.academicTermId))];
    const terms = termIds.length ? await prisma.$queryRaw<Array<{
      id: string; s_term_code: string; s_term_name: string; s_year_code: string; s_term_order: number; s_is_summer: boolean;
    }>>`
      SELECT t.id::text, t.s_term_code, t.s_term_name, y.s_year_code, t.s_term_order, t.s_is_summer
      FROM academic_terms t JOIN academic_years y ON y.id = t.academic_year_id
      WHERE t.id = ANY(${termIds}::uuid[])
    ` : [];
    const periods = new Map(terms.map((term) => [term.id, {
      yearCode: term.s_year_code,
      termCode: term.s_term_code,
      termName: term.s_term_name,
      isSummer: term.s_is_summer,
      order: Number(term.s_term_order),
    }]));
    const items = records
      .map((record) => serialize(record, periods.get(record.academicTermId)))
      .sort((a, b) => `${a.academicYear || ""}:${periods.get(a.academicTermId)?.order || 0}`
        .localeCompare(`${b.academicYear || ""}:${periods.get(b.academicTermId)?.order || 0}`));
    return {
      student: { id: student.id, studentCode: student.sStudentId, fullName: student.sFullName },
      items,
      total: items.length,
      approved: items.filter((item) => item.approval.code === "approved").length,
      pending: items.filter((item) => item.approval.code === "pending").length,
    };
  }

  static async detailForStudent(studentIdentifier: string, academicTermId: string) {
    const list = await this.listForStudent(studentIdentifier);
    const item = list.items.find((record) => record.academicTermId === academicTermId);
    if (!item) throw new ApiError("Conduct record not found for the selected term", "NOT_FOUND", 404);
    return { student: list.student, item };
  }
}
