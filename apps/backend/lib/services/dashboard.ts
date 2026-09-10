import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ReportsService } from "@/lib/services/reports";

interface DashboardFilters {
  academicYear?: string;
  termCode?: string;
  programCode?: string;
  classId?: string;
  gpaScope?: string;
  gpaAggregation?: string;
  page?: number;
  pageSize?: number;
  cohortId?: string;
  trainingProgramId?: string;
  academicTermId?: string;
}

type WarningSnapshot = {
  runId: string;
  studentId: string;
  classId: string | null;
  cohortId: string | null;
  sStudentId: string;
  sStudentName: string;
  sClassName: string | null;
  sProgramCode: string | null;
  termGpa4: Prisma.Decimal | null;
  cumulativeGpa4: Prisma.Decimal | null;
  registrationStatus: string;
  scheduleStatus: string;
  maxSeverity: string;
  reasonCount: number;
};

const availableMetric = (value: number, numerator?: number, denominator?: number) => ({
  value,
  ...(numerator === undefined ? {} : { numerator }),
  ...(denominator === undefined ? {} : { denominator }),
  status: "available",
});

const unavailableMetric = () => ({
  value: null,
  status: "unavailable",
  reason: "Chưa có dữ liệu cho bộ lọc đã chọn.",
});

function percentage(pass: number, total: number) {
  return total ? availableMetric((pass * 100) / total, pass, total) : unavailableMetric();
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function decimalNumber(value: Prisma.Decimal | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function progressPoint(
  code: string,
  name: string,
  rows: WarningSnapshot[],
  field: "scheduleStatus" | "registrationStatus",
) {
  const values = rows.map((row) => row[field]);
  if (field === "scheduleStatus") {
    return {
      code,
      name,
      total: rows.length,
      pass: values.filter((value) => value === "on_track").length,
      fail: values.filter((value) => value === "behind_schedule").length,
      pending: values.filter((value) => value === "pending_result").length,
      error: values.filter((value) => value === "data_error" || value === "no_due_plan").length,
    };
  }
  return {
    code,
    name,
    total: rows.length,
    pass: values.filter((value) => value === "pass").length,
    fail: values.filter((value) => value === "fail").length,
    pending: values.filter((value) => value === "pending").length,
    error: values.filter((value) => value === "data_error").length,
  };
}

export class DashboardService {
  static async getSummary(
    filters: DashboardFilters = {},
    studentScope: Prisma.StudentWhereInput = {},
    warningScope: Prisma.AcademicWarningRunWhereInput = {},
  ) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : 10;
    const gpaScope = filters.gpaScope === "term" && filters.academicYear && filters.termCode
      ? "term"
      : "cumulative";
    const gpaAggregation = filters.gpaAggregation === "average" ? "average" : "median";

    const selectedProgram = filters.trainingProgramId
      ? await prisma.trainingProgram.findFirst({ where: { id: filters.trainingProgramId, deletedAt: null } })
      : filters.programCode
        ? await prisma.trainingProgram.findFirst({ where: { sProgramCode: filters.programCode, deletedAt: null } })
        : null;

    const filteredClasses = filters.classId || filters.cohortId
      ? await prisma.class.findMany({
          where: {
            deletedAt: null,
            isActive: true,
            ...(filters.classId ? { id: filters.classId } : {}),
            ...(filters.cohortId ? { cohortId: filters.cohortId } : {}),
          },
        })
      : null;
    const studentWhere: Prisma.StudentWhereInput = {
      AND: [
        { deletedAt: null },
        studentScope,
        ...(filters.trainingProgramId || filters.programCode
          ? [{ sStudyProgramId: selectedProgram ? selectedProgram.sProgramCode : { in: [] } }]
          : []),
        ...(filteredClasses ? [{ sClassStudentId: { in: filteredClasses.map((item) => item.classId) } }] : []),
      ],
    };
    const scopedStudents = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true, sClassStudentId: true, sStudyProgramId: true },
    });
    const scopedStudentIds = scopedStudents.map((student) => student.id);

    let selectedYear = filters.academicYear
      ? await prisma.academicYear.findFirst({ where: { sYearCode: filters.academicYear, deletedAt: null } })
      : null;
    let selectedTerm = filters.academicTermId
      ? await prisma.academicTerm.findFirst({ where: { id: filters.academicTermId, deletedAt: null } })
      : null;
    if (!selectedTerm && selectedYear && filters.termCode) {
      selectedTerm = await prisma.academicTerm.findFirst({
        where: { academicYearId: selectedYear.id, sTermCode: filters.termCode.toUpperCase(), deletedAt: null },
      });
    }
    if (!selectedTerm && !filters.academicYear && !filters.termCode) {
      selectedTerm = await prisma.academicTerm.findFirst({
        where: { isCurrent: true, deletedAt: null },
        orderBy: { updatedAt: "desc" },
      });
    }
    if (selectedTerm && !selectedYear) {
      selectedYear = await prisma.academicYear.findFirst({ where: { id: selectedTerm.academicYearId, deletedAt: null } });
    }

    const liveWarningReportPromise = ReportsService.academicWarningStudents(
      { page, pageSize },
      studentWhere,
    );
    const directGpaRows = !scopedStudentIds.length
      ? []
      : gpaScope === "term"
        ? selectedTerm
          ? (await prisma.studentTermSummary.findMany({
              where: { studentId: { in: scopedStudentIds }, academicTermId: selectedTerm.id },
              select: { studentId: true, sProgramCode: true, gpa4: true },
            })).map((row) => ({ ...row, value: row.gpa4 }))
          : []
        : (await prisma.studentCumulativeSummary.findMany({
            where: { studentId: { in: scopedStudentIds } },
            orderBy: { refreshedAt: "desc" },
            select: { studentId: true, sProgramCode: true, cumulativeGpa4: true },
          })).map((row) => ({
            studentId: row.studentId,
            sProgramCode: row.sProgramCode,
            value: row.cumulativeGpa4,
          }));
    const scopedStudentMap = new Map(scopedStudents.map((student) => [student.id, student]));
    const directGpaByStudent = new Map<string, number>();
    for (const row of directGpaRows) {
      if (directGpaByStudent.has(row.studentId)) continue;
      const student = scopedStudentMap.get(row.studentId);
      if (student?.sStudyProgramId && row.sProgramCode && student.sStudyProgramId !== row.sProgramCode) continue;
      const value = decimalNumber(row.value);
      if (value !== null) directGpaByStudent.set(row.studentId, value);
    }

    const warningFilter: Prisma.AcademicWarningRunWhereInput = {
      status: "completed",
      ...(filters.cohortId ? { cohortId: filters.cohortId } : {}),
    };
    if (filters.trainingProgramId || filters.programCode) {
      warningFilter.trainingProgramId = selectedProgram ? selectedProgram.id : { in: [] };
    }
    if (filters.academicTermId || filters.academicYear || filters.termCode || selectedTerm) {
      warningFilter.assessmentAcademicTermId = selectedTerm ? selectedTerm.id : { in: [] };
    }

    const [years, programs, allVisibleClasses, cohorts, completedRuns] = await Promise.all([
      prisma.academicYear.findMany({ where: { deletedAt: null }, orderBy: { sYearCode: "desc" } }),
      prisma.trainingProgram.findMany({ where: { deletedAt: null, status: "active" }, orderBy: { sProgramName: "asc" } }),
      prisma.class.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { className: "asc" } }),
      prisma.cohort.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { sCohortName: "asc" } }),
      prisma.academicWarningRun.findMany({
        where: {
          AND: [
            warningFilter,
            warningScope,
          ],
        },
        orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }],
        take: 500,
      }),
    ]);

    const latestRunByScope = new Map<string, (typeof completedRuns)[number]>();
    for (const run of completedRuns) {
      const key = `${run.cohortId}:${run.trainingProgramId}:${run.assessmentAcademicTermId}`;
      if (!latestRunByScope.has(key)) latestRunByScope.set(key, run);
    }
    const latestRuns = [...latestRunByScope.values()];
    const warningRows: WarningSnapshot[] = latestRuns.length && scopedStudentIds.length
      ? await prisma.academicWarningStudentResult.findMany({
          where: { runId: { in: latestRuns.map((run) => run.id) }, studentId: { in: scopedStudentIds } },
          select: {
            runId: true,
            studentId: true,
            classId: true,
            cohortId: true,
            sStudentId: true,
            sStudentName: true,
            sClassName: true,
            sProgramCode: true,
            termGpa4: true,
            cumulativeGpa4: true,
            registrationStatus: true,
            scheduleStatus: true,
            maxSeverity: true,
            reasonCount: true,
          },
        })
      : [];
    const latestWarningByStudent = new Map<string, WarningSnapshot>();
    for (const row of warningRows) {
      if (!latestWarningByStudent.has(row.studentId)) latestWarningByStudent.set(row.studentId, row);
    }
    const latestWarnings = [...latestWarningByStudent.values()];
    const liveWarningReport = await liveWarningReportPromise;

    const classCodes = new Set(scopedStudents.map((student) => student.sClassStudentId).filter(Boolean));
    const programCodes = new Set(scopedStudents.map((student) => student.sStudyProgramId).filter(Boolean));
    const classes = allVisibleClasses.filter((item) => classCodes.has(item.classId));
    const red = liveWarningReport.counts.high;
    const yellow = liveWarningReport.counts.medium;
    const warningStudents = red + yellow;

    const gpaValues = [...directGpaByStudent.values()];
    const averageGpa = gpaValues.length
      ? gpaValues.reduce((sum, value) => sum + value, 0) / gpaValues.length
      : null;
    const aggregateGpa = gpaAggregation === "average" ? averageGpa : median(gpaValues);

    const gradeGroups = new Map<string, number>();
    for (const value of gpaValues) {
      const name = value >= 3.6 ? "Xuất sắc" : value >= 3.2 ? "Giỏi" : value >= 2.5 ? "Khá" : value >= 2 ? "Trung bình" : "Yếu";
      gradeGroups.set(name, (gradeGroups.get(name) || 0) + 1);
    }
    const gradeDistribution = [...gradeGroups].map(([name, count]) => ({
      name,
      count,
      rate: gpaValues.length ? Number(((count * 100) / gpaValues.length).toFixed(1)) : 0,
    }));

    const byCohort = cohorts.map((cohort) => progressPoint(
      cohort.sCohortCode,
      cohort.sCohortName,
      latestWarnings.filter((row) => row.cohortId === cohort.id),
      "scheduleStatus",
    )).filter((item) => item.total > 0);
    const byProgram = programs.map((program) => progressPoint(
      program.sProgramCode,
      program.sProgramName,
      latestWarnings.filter((row) => row.sProgramCode === program.sProgramCode),
      "scheduleStatus",
    )).filter((item) => item.total > 0);
    const registrationByCohort = cohorts.map((cohort) => progressPoint(
      cohort.sCohortCode,
      cohort.sCohortName,
      latestWarnings.filter((row) => row.cohortId === cohort.id),
      "registrationStatus",
    )).filter((item) => item.total > 0);
    const registrationByProgram = programs.map((program) => progressPoint(
      program.sProgramCode,
      program.sProgramName,
      latestWarnings.filter((row) => row.sProgramCode === program.sProgramCode),
      "registrationStatus",
    )).filter((item) => item.total > 0);

    const gpaByClass = classes.map((item) => {
      const values = scopedStudents
        .filter((student) => student.sClassStudentId === item.classId)
        .map((student) => directGpaByStudent.get(student.id))
        .filter((value): value is number => value !== undefined);
      const value = gpaAggregation === "average"
        ? (values.length ? values.reduce((sum, current) => sum + current, 0) / values.length : null)
        : median(values);
      return { classId: item.classId, className: item.className, value, count: values.length };
    });

    const scheduleAll = progressPoint("all", "Toàn Khoa", latestWarnings, "scheduleStatus");
    const registrationAll = progressPoint("all", "Toàn Khoa", latestWarnings, "registrationStatus");
    const currentYear = selectedYear || years.find((year) => year.isCurrent) || null;
    const terms = currentYear
      ? await prisma.academicTerm.findMany({ where: { academicYearId: currentYear.id, deletedAt: null }, orderBy: { sTermOrder: "asc" } })
      : [];
    const activeClassCodes = new Set(allVisibleClasses.map((item) => item.classId));
    const studentsWithoutClass = scopedStudents.filter((student) => !student.sClassStudentId || !activeClassCodes.has(student.sClassStudentId)).length;

    const sweResponse = {
      studentCount: scopedStudents.length,
      classCount: classes.length,
      currentAcademicYear: currentYear ? { id: currentYear.id, yearCode: currentYear.sYearCode } : null,
      alerts: [{ code: "STUDENT_WITHOUT_ACTIVE_CLASS", count: studentsWithoutClass, severity: "warning" }],
      generatedAt: new Date().toISOString(),
      filter: {
        ...(currentYear ? { academicYear: currentYear.sYearCode } : {}),
        ...(selectedTerm ? { termCode: selectedTerm.sTermCode } : {}),
        ...(selectedProgram ? { programCode: selectedProgram.sProgramCode } : {}),
        ...(filters.classId ? { classId: filters.classId } : {}),
        gpaScope,
        gpaAggregation,
      },
      metrics: {
        studentCount: availableMetric(scopedStudents.length),
        classCount: availableMetric(classes.length),
        averageGpa: aggregateGpa === null ? unavailableMetric() : availableMetric(aggregateGpa, gpaValues.length, gpaValues.length),
        completionRate: percentage(scheduleAll.pass, scheduleAll.total),
        registrationRate: percentage(registrationAll.pass, registrationAll.total),
        warningStudents: availableMetric(warningStudents, warningStudents, scopedStudents.length),
        graduationForecastRate: percentage(scheduleAll.pass, scheduleAll.total),
      },
      gradeDistribution,
      gpaTrend: selectedTerm && gpaValues.length
        ? [{
            label: `${currentYear?.sYearCode || ""} ${selectedTerm.sTermCode}`.trim(),
            academicYear: currentYear?.sYearCode || "",
            termCode: selectedTerm.sTermCode,
            average: averageGpa || 0,
            count: gpaValues.length,
          }]
        : [],
      cohortProgress: [scheduleAll, ...byCohort],
      programProgress: [scheduleAll, ...byProgram],
      conductByClass: classes.map((item) => ({ classId: item.classId, className: item.className, median: null, count: 0 })),
      gpaByClass,
      registrationProgress: [registrationAll, ...registrationByCohort],
      programRegistrationProgress: [registrationAll, ...registrationByProgram],
      graduationForecast: {
        total: scheduleAll.total,
        onTime: scheduleAll.pass,
        conditional: scheduleAll.pending,
        incomplete: scheduleAll.fail,
        cannotDetermine: scheduleAll.error,
      },
      academicWarnings: {
        items: liveWarningReport.items.map((row) => ({
          studentId: row.studentId,
          studentCode: row.studentCode,
          studentName: row.studentName,
          className: row.classCode,
          programCode: row.programCode,
          termGpa: row.termGpa4,
          cumulativeGpa: row.cumulativeGpa4,
          registrationStatus: "unassessed",
          scheduleStatus: "unassessed",
          severity: row.severity,
          reasonCount: row.reasonCount,
        })),
        total: liveWarningReport.total,
        page,
        pageSize,
      },
      filterOptions: {
        academicYears: years.map((year) => ({ value: year.sYearCode, label: year.sYearCode })),
        terms: terms.map((term) => ({ value: term.sTermCode, label: term.sTermName })),
        programs: programs
          .filter((program) => programCodes.has(program.sProgramCode))
          .map((program) => ({ value: program.sProgramCode, label: program.sProgramName })),
        classes: classes.map((item) => ({ value: item.id, label: item.className })),
      },
    };

    return {
      ...sweResponse,
      totalStudents: scopedStudents.length,
      totalClasses: classes.length,
      totalPrograms: new Set(scopedStudents.map((student) => student.sStudyProgramId).filter(Boolean)).size,
      currentTerm: selectedTerm
        ? { termCode: selectedTerm.sTermCode, termName: selectedTerm.sTermName, academicYear: currentYear?.sYearCode || null }
        : null,
      counts: {
        red,
        yellow,
        green: liveWarningReport.counts.safe,
        evaluated: liveWarningReport.counts.evaluated,
        unassessed: liveWarningReport.counts.unassessed,
      },
      topClasses: classes.map((item) => {
        const total = scopedStudents.filter((student) => student.sClassStudentId === item.classId).length;
        const warning = liveWarningReport.classBreakdown.find((row) => row.classCode === item.classId)?.warningStudents || 0;
        return {
          classId: item.classId,
          className: item.className,
          total,
          warning,
          rate: total ? Math.round((warning / total) * 100) : 0,
          faculty: selectedProgram?.s_faculty_code || "",
        };
      }).sort((a, b) => b.rate - a.rate).slice(0, 5),
      warningByClass: liveWarningReport.classBreakdown.map((item) => ({
        classId: item.classCode,
        className: item.className,
        red: item.high,
        yellow: item.medium,
      })),
      semesterTrend: [],
      updatedAt: sweResponse.generatedAt,
    };
  }
}
