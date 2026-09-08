import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type WarningLevel = "high" | "medium" | "none";

type WarningStudent = {
  studentId: string;
  studentCode: string;
  studentName: string;
  classCode: string;
  programCode: string;
  termGpa4: number | null;
  cumulativeGpa4: number | null;
  severity: WarningLevel;
  reasonCodes: string[];
  reasonCount: number;
  academicWarningDecisions: number;
  resolvedActions: number;
  academicYear: string | null;
  termCode: string | null;
};

const numberOrNull = (value: unknown) => value == null ? null : Number(value);

export class ReportsService {
  static async academicWarningStudents(
    filters: { severity?: string; classCode?: string; search?: string; page?: number; pageSize?: number } = {},
    studentScope: Prisma.StudentWhereInput = {},
  ) {
    const page = Math.max(1, filters.page || 1);
    // API routes still cap public pagination at 100. Internal consumers such as
    // the student list may request the complete warning set for accurate filters.
    const pageSize = Math.min(1000, Math.max(1, filters.pageSize || 20));
    const [students, policy, terms, years, classes] = await Promise.all([
      prisma.student.findMany({
        where: { AND: [{ deletedAt: null }, studentScope] },
        select: {
          id: true,
          sStudentId: true,
          sFullName: true,
          sClassStudentId: true,
          sStudyProgramId: true,
        },
      }),
      prisma.academicWarningPolicy.findFirst({
        where: { status: "active" },
        orderBy: { version: "desc" },
      }),
      prisma.academicTerm.findMany({ where: { deletedAt: null } }),
      prisma.academicYear.findMany({ where: { deletedAt: null } }),
      prisma.class.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { classId: "asc" } }),
    ]);

    const studentIds = students.map((student) => student.id);
    const [termSummaries, cumulativeSummaries, warningDecisions, actions] = studentIds.length
      ? await Promise.all([
          prisma.studentTermSummary.findMany({ where: { studentId: { in: studentIds } } }),
          prisma.studentCumulativeSummary.findMany({
            where: { studentId: { in: studentIds } },
            orderBy: { refreshedAt: "desc" },
          }),
          prisma.studentDecision.findMany({
            where: { studentId: { in: studentIds }, deletedAt: null, isAcademicWarning: true },
            select: { studentId: true },
          }),
          prisma.warningAction.findMany({
            where: { studentId: { in: studentIds }, status: "RESOLVED" },
            select: { studentId: true },
          }),
        ])
      : [[], [], [], []];

    const termMap = new Map(terms.map((term) => [term.id, term]));
    const yearMap = new Map(years.map((year) => [year.id, year]));
    const studentMap = new Map(students.map((student) => [student.id, student]));
    const summarySortKey = (academicTermId: string) => {
      const term = termMap.get(academicTermId);
      const year = term ? yearMap.get(term.academicYearId) : null;
      return `${year?.sYearCode || ""}|${String(term?.sTermOrder || 0).padStart(2, "0")}`;
    };

    const latestSummary = new Map<string, (typeof termSummaries)[number]>();
    const summariesByStudentTerm = new Map<string, (typeof termSummaries)[number]>();
    for (const summary of termSummaries) {
      const student = studentMap.get(summary.studentId);
      if (student?.sStudyProgramId && summary.sProgramCode !== student.sStudyProgramId) continue;
      const previous = latestSummary.get(summary.studentId);
      if (!previous || summarySortKey(summary.academicTermId) > summarySortKey(previous.academicTermId)) {
        latestSummary.set(summary.studentId, summary);
      }
      summariesByStudentTerm.set(`${summary.studentId}|${summary.academicTermId}`, summary);
    }

    const cumulativeByStudent = new Map<string, (typeof cumulativeSummaries)[number]>();
    for (const summary of cumulativeSummaries) {
      const student = studentMap.get(summary.studentId);
      if (cumulativeByStudent.has(summary.studentId)) continue;
      if (student?.sStudyProgramId && summary.sProgramCode !== student.sStudyProgramId) continue;
      cumulativeByStudent.set(summary.studentId, summary);
    }
    const decisionCounts = new Map<string, number>();
    for (const decision of warningDecisions) {
      decisionCounts.set(decision.studentId, (decisionCounts.get(decision.studentId) || 0) + 1);
    }
    const resolvedCounts = new Map<string, number>();
    for (const action of actions) {
      resolvedCounts.set(action.studentId, (resolvedCounts.get(action.studentId) || 0) + 1);
    }

    const termGpaThreshold = Number(policy?.termGpaThreshold ?? 2);
    const cumulativeGpaThreshold = Number(policy?.cumulativeGpaThreshold ?? 2);
    const evaluatedStudents: WarningStudent[] = students.map((student) => {
      const latest = latestSummary.get(student.id);
      const cumulative = cumulativeByStudent.get(student.id);
      const term = latest ? termMap.get(latest.academicTermId) : null;
      const year = term ? yearMap.get(term.academicYearId) : null;
      const termGpa4 = numberOrNull(latest?.gpa4);
      const cumulativeGpa4 = numberOrNull(cumulative?.cumulativeGpa4 ?? latest?.cumulativeGpa4);
      const decisionCount = decisionCounts.get(student.id) || 0;
      const reasonCodes: string[] = [];
      let severity: WarningLevel = "none";
      if (termGpa4 != null && termGpa4 < termGpaThreshold) {
        reasonCodes.push("LOW_TERM_GPA");
        severity = "medium";
      }
      if (cumulativeGpa4 != null && cumulativeGpa4 < cumulativeGpaThreshold) {
        reasonCodes.push("LOW_CUMULATIVE_GPA");
        severity = "high";
      }
      if (decisionCount > 0) {
        reasonCodes.push("ACADEMIC_WARNING_DECISION");
        severity = "high";
      }
      return {
        studentId: student.id,
        studentCode: student.sStudentId,
        studentName: student.sFullName,
        classCode: student.sClassStudentId || "Chưa phân lớp",
        programCode: student.sStudyProgramId || "",
        termGpa4,
        cumulativeGpa4,
        severity,
        reasonCodes,
        reasonCount: reasonCodes.length,
        academicWarningDecisions: decisionCount,
        resolvedActions: resolvedCounts.get(student.id) || 0,
        academicYear: year?.sYearCode || null,
        termCode: term?.sTermCode || null,
      };
    });

    const warningStudents = evaluatedStudents.filter((student) => student.severity !== "none");
    const classBreakdown = classes
      .map((studentClass) => {
        const classStudents = students.filter((student) => student.sClassStudentId === studentClass.classId);
        const classWarnings = warningStudents.filter((student) => student.classCode === studentClass.classId);
        const high = classWarnings.filter((student) => student.severity === "high").length;
        const medium = classWarnings.filter((student) => student.severity === "medium").length;
        return {
          classCode: studentClass.classId,
          className: studentClass.className,
          totalStudents: classStudents.length,
          high,
          medium,
          warningStudents: high + medium,
          warningRate: classStudents.length ? Math.round(((high + medium) / classStudents.length) * 100) : 0,
        };
      })
      .filter((item) => item.totalStudents > 0);

    const trend = terms
      .map((term) => {
        const year = yearMap.get(term.academicYearId);
        const rows = [...summariesByStudentTerm.entries()]
          .filter(([key]) => key.endsWith(`|${term.id}`))
          .map(([, summary]) => summary);
        let high = 0;
        let medium = 0;
        for (const summary of rows) {
          const cumulative = numberOrNull(summary.cumulativeGpa4);
          const termGpa = numberOrNull(summary.gpa4);
          if (cumulative != null && cumulative < cumulativeGpaThreshold) high += 1;
          else if (termGpa != null && termGpa < termGpaThreshold) medium += 1;
        }
        return {
          academicYear: year?.sYearCode || "",
          termCode: term.sTermCode,
          termOrder: term.sTermOrder,
          label: `${term.sTermCode} (${year?.sYearCode || ""})`,
          high,
          medium,
          evaluated: rows.length,
        };
      })
      .filter((item) => item.evaluated > 0)
      .sort((left, right) => `${left.academicYear}|${left.termOrder}`.localeCompare(`${right.academicYear}|${right.termOrder}`))
      .slice(-5);

    const search = filters.search?.trim().toLocaleLowerCase("vi-VN") || "";
    const filtered = warningStudents
      .filter((student) => !filters.severity || student.severity === filters.severity)
      .filter((student) => !filters.classCode || student.classCode === filters.classCode)
      .filter((student) => !search || `${student.studentCode} ${student.studentName}`.toLocaleLowerCase("vi-VN").includes(search))
      .sort((left, right) => {
        const severityOrder = { high: 0, medium: 1, none: 2 };
        return severityOrder[left.severity] - severityOrder[right.severity]
          || left.classCode.localeCompare(right.classCode)
          || left.studentCode.localeCompare(right.studentCode);
      });
    const offset = (page - 1) * pageSize;
    const evaluated = evaluatedStudents.filter((student) => student.termGpa4 != null || student.cumulativeGpa4 != null).length;
    const high = warningStudents.filter((student) => student.severity === "high").length;
    const medium = warningStudents.filter((student) => student.severity === "medium").length;

    return {
      items: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
      counts: {
        students: students.length,
        evaluated,
        unassessed: students.length - evaluated,
        high,
        medium,
        safe: Math.max(0, evaluated - high - medium),
      },
      policy: {
        id: policy?.id || null,
        name: policy?.name || "Ngưỡng cảnh báo mặc định",
        termGpaThreshold,
        cumulativeGpaThreshold,
        configured: Boolean(policy),
      },
      latestPeriod: trend.at(-1) || null,
      trend,
      classBreakdown,
    };
  }
}
