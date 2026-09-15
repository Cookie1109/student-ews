import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { AcademicWarningsService } from "../lib/services/academic-warnings";
import { sha256Hex } from "../lib/utils/crypto";

const prisma = new PrismaClient();

const permissions = [
  ["student.read", "Xem sinh viên", "student", "read"],
  ["student.create", "Tạo sinh viên", "student", "create"],
  ["student.update", "Cập nhật sinh viên", "student", "update"],
  ["student.delete", "Xóa sinh viên", "student", "delete"],
  ["student.import", "Nhập sinh viên", "student", "import"],
  ["student.export", "Xuất sinh viên", "student", "export"],
  ["grade.read", "Xem điểm", "grade", "read"],
  ["grade.import", "Nhập điểm", "grade", "import"],
  ["grade.export", "Xuất điểm", "grade", "export"],
  ["decision.read", "Xem quyết định", "decision", "read"],
  ["decision.create", "Tạo quyết định", "decision", "create"],
  ["decision.update", "Cập nhật quyết định", "decision", "update"],
  ["decision.delete", "Xóa quyết định", "decision", "delete"],
  ["decision.import", "Nhập quyết định", "decision", "import"],
  ["decision.export", "Xuất quyết định", "decision", "export"],
  ["fee_policy.read", "Xem chính sách học phí", "fee_policy", "read"],
  ["fee_policy.create", "Tạo chính sách học phí", "fee_policy", "create"],
  ["fee_policy.update", "Cập nhật chính sách học phí", "fee_policy", "update"],
  ["fee_policy.delete", "Xóa chính sách học phí", "fee_policy", "delete"],
  ["fee_policy.import", "Nhập chính sách học phí", "fee_policy", "import"],
  ["fee_policy.export", "Xuất chính sách học phí", "fee_policy", "export"],
  ["class.manage", "Quản lý lớp và khóa", "class", "manage"],
  ["academic_term.manage", "Quản lý học kỳ và CTĐT", "academic_term", "manage"],
  ["progress.read", "Xem tiến độ", "progress", "read"],
  ["progress.plan.manage", "Quản lý kế hoạch tiến độ", "progress", "manage"],
  ["progress.calculate", "Tính tiến độ", "progress", "calculate"],
  ["academic_warning.read", "Xem cảnh báo", "academic_warning", "read"],
  ["academic_warning.calculate", "Tính cảnh báo", "academic_warning", "calculate"],
  ["academic_warning.policy.manage", "Quản lý chính sách cảnh báo", "academic_warning_policy", "manage"],
  ["academic_warning.action.create", "Tạo hồ sơ hỗ trợ", "academic_warning_action", "create"],
  ["academic_warning.action.update", "Cập nhật hồ sơ hỗ trợ", "academic_warning_action", "update"],
  ["user.manage", "Quản lý tài khoản", "user", "manage"],
  ["role.manage", "Quản lý vai trò và quyền", "role", "manage"],
  ["advisor_assignment.manage", "Quản lý phân công cố vấn", "advisor_assignment", "manage"],
] as const;

async function seedRbac() {
  const permissionRows = await Promise.all(permissions.map(([code, name, resource, action]) =>
    prisma.permission.upsert({
      where: { code },
      update: { name, resource, action, isAssignable: true },
      create: { code, name, resource, action, isAssignable: true },
    }),
  ));

  const adminRole = await prisma.role.upsert({
    where: { code: "admin" },
    update: { name: "Quản trị hệ thống", dataScope: "system", isSystem: true, isActive: true, deletedAt: null },
    create: { code: "admin", name: "Quản trị hệ thống", dataScope: "system", isSystem: true },
  });
  const advisorRole = await prisma.role.upsert({
    where: { code: "class_advisor" },
    update: { name: "Cố vấn học tập", dataScope: "assigned_classes", isSystem: true, isActive: true, deletedAt: null },
    create: { code: "class_advisor", name: "Cố vấn học tập", dataScope: "assigned_classes", isSystem: true },
  });

  await prisma.rolePermission.createMany({
    data: permissionRows.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })),
    skipDuplicates: true,
  });
  const advisorCodes = new Set([
    "student.read",
    "grade.read",
    "decision.read",
    "progress.read",
    "academic_warning.read",
    "academic_warning.action.create",
    "academic_warning.action.update",
  ]);
  await prisma.rolePermission.createMany({
    data: permissionRows
      .filter((permission) => advisorCodes.has(permission.code))
      .map((permission) => ({ roleId: advisorRole.id, permissionId: permission.id })),
    skipDuplicates: true,
  });

  const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
  const advisorUsername = process.env.SEED_ADVISOR_USERNAME || "advisor.demo";
  const advisorPassword = process.env.SEED_ADVISOR_PASSWORD || "Advisor@123456";
  const [existingAdmin, existingAdvisor] = await Promise.all([
    prisma.user.findUnique({ where: { username: adminUsername }, select: { passwordHash: true } }),
    prisma.user.findUnique({ where: { username: advisorUsername }, select: { passwordHash: true } }),
  ]);
  const [adminPasswordHash, advisorPasswordHash] = await Promise.all([
    existingAdmin?.passwordHash || hashPassword(adminPassword),
    existingAdvisor?.passwordHash || hashPassword(advisorPassword),
  ]);
  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: { fullName: "Quản trị SEWS", isActive: true, deletedAt: null },
    create: { username: adminUsername, fullName: "Quản trị SEWS", passwordHash: adminPasswordHash },
  });
  const advisor = await prisma.user.upsert({
    where: { username: advisorUsername },
    update: { fullName: "Cố vấn Demo", isActive: true, deletedAt: null },
    create: { username: advisorUsername, fullName: "Cố vấn Demo", passwordHash: advisorPasswordHash },
  });
  await prisma.userRole.createMany({
    data: [
      { userId: admin.id, roleId: adminRole.id },
      { userId: advisor.id, roleId: advisorRole.id },
    ],
    skipDuplicates: true,
  });
  return {
    admin,
    advisor,
    adminUsername,
    adminPassword,
    advisorUsername,
    advisorPassword,
    adminCreated: !existingAdmin,
    advisorCreated: !existingAdvisor,
  };
}

async function seedDemoData(adminId: string, advisorId: string) {
  const academicYear = await prisma.academicYear.upsert({
    where: { sYearCode: "2025-2026" },
    update: { status: "active", isCurrent: true, deletedAt: null },
    create: { sYearCode: "2025-2026", status: "active", isCurrent: true },
  });
  const term = await prisma.academicTerm.upsert({
    where: { academicYearId_sTermCode: { academicYearId: academicYear.id, sTermCode: "HK02" } },
    update: { sTermName: "Học kỳ 2", sTermOrder: 2, status: "completed", isCurrent: true, deletedAt: null },
    create: {
      academicYearId: academicYear.id,
      sTermCode: "HK02",
      sTermName: "Học kỳ 2",
      sTermOrder: 2,
      status: "completed",
      isCurrent: true,
    },
  });
  const cohort = await prisma.cohort.upsert({
    where: { sCohortCode: "K44" },
    update: { sCohortName: "Khóa 44", isActive: true, deletedAt: null },
    create: { sCohortCode: "K44", sCohortName: "Khóa 44" },
  });
  const program = await prisma.trainingProgram.upsert({
    where: { sProgramCode: "CNTT-K44" },
    update: { sProgramName: "Công nghệ thông tin K44", status: "active", isActive: true, deletedAt: null },
    create: {
      sProgramCode: "CNTT-K44",
      sProgramName: "Công nghệ thông tin K44",
      sDegreeLevel: "Đại học",
      sMajor: "Công nghệ thông tin",
      sStudyType: "Chính quy",
      s_faculty_code: "CNTT",
    },
  });
  const studentClass = await prisma.class.upsert({
    where: { classId: "44K01" },
    update: { className: "CNTT K44 - Lớp 1", cohortId: cohort.id, isActive: true, deletedAt: null },
    create: { classId: "44K01", className: "CNTT K44 - Lớp 1", cohortId: cohort.id },
  });
  await prisma.lecturerProfile.upsert({
    where: { userId: advisorId },
    update: { staffCode: "GV-DEMO", facultyCode: "CNTT" },
    create: { userId: advisorId, staffCode: "GV-DEMO", facultyCode: "CNTT" },
  });
  await prisma.classAdvisorAssignment.upsert({
    where: { classId_academicTermId: { classId: studentClass.id, academicTermId: term.id } },
    update: { userId: advisorId, status: "active", assignedById: adminId, revokedAt: null, revokedById: null },
    create: { userId: advisorId, classId: studentClass.id, academicTermId: term.id, assignedById: adminId },
  });

  const demoStudents = [
    { code: "SVDEMO001", first: "An", last: "Nguyễn Văn", full: "Nguyễn Văn An", gpa4: 1.65, cumulativeGpa4: 1.82 },
    { code: "SVDEMO002", first: "Bình", last: "Trần Thị", full: "Trần Thị Bình", gpa4: 2.85, cumulativeGpa4: 2.72 },
    { code: "SVDEMO003", first: "Châu", last: "Lê Minh", full: "Lê Minh Châu", gpa4: 3.45, cumulativeGpa4: 3.21 },
  ];
  const students = [];
  for (const demo of demoStudents) {
    const existing = await prisma.student.findFirst({ where: { sStudentId: demo.code, deletedAt: null } });
    const student = existing || await prisma.student.create({
      data: {
        sStudentId: demo.code,
        sFirstName: demo.first,
        sLastName: demo.last,
        sFullName: demo.full,
        sBirthDate: new Date("2004-01-01T00:00:00.000Z"),
        sClassStudentId: studentClass.classId,
        sStudyProgramId: program.sProgramCode,
      },
    });
    const summary = await prisma.studentTermSummary.upsert({
      where: {
        studentId_sProgramCode_academicTermId: {
          studentId: student.id,
          sProgramCode: program.sProgramCode,
          academicTermId: term.id,
        },
      },
      update: {
        registeredCredits: 15,
        creditsEarned: 15,
        gpa4: demo.gpa4,
        cumulativeGpa4: demo.cumulativeGpa4,
        sourcePayload: { seed: true },
      },
      create: {
        studentId: student.id,
        academicTermId: term.id,
        sProgramCode: program.sProgramCode,
        registeredCredits: 15,
        creditsEarned: 15,
        gpa4: demo.gpa4,
        cumulativeGpa4: demo.cumulativeGpa4,
        sourcePayload: { seed: true },
      },
    });
    await prisma.studentCumulativeSummary.upsert({
      where: { studentId_sProgramCode: { studentId: student.id, sProgramCode: program.sProgramCode } },
      update: {
        cumulativeCredits: 90,
        cumulativeRegisteredCredits: 96,
        cumulativeGpa4: demo.cumulativeGpa4,
        sourceTermSummaryId: summary.id,
        sourceAcademicYearId: academicYear.id,
        sourceAcademicTermId: term.id,
        refreshedAt: new Date(),
      },
      create: {
        studentId: student.id,
        sProgramCode: program.sProgramCode,
        cumulativeCredits: 90,
        cumulativeRegisteredCredits: 96,
        cumulativeGpa4: demo.cumulativeGpa4,
        sourceTermSummaryId: summary.id,
        sourceAcademicYearId: academicYear.id,
        sourceAcademicTermId: term.id,
      },
    });
    students.push(student);
  }

  const plan = await prisma.trainingProgressPlan.upsert({
    where: {
      cohortId_trainingProgramId_academicTermId_version: {
        cohortId: cohort.id,
        trainingProgramId: program.id,
        academicTermId: term.id,
        version: 1,
      },
    },
    update: { status: "locked", isCurrent: true },
    create: {
      cohortId: cohort.id,
      trainingProgramId: program.id,
      academicYearId: academicYear.id,
      academicTermId: term.id,
      curriculumSemesterNo: 6,
      version: 1,
      status: "locked",
      isCurrent: true,
    },
  });
  let progressRun = await prisma.trainingProgressCalculationRun.findFirst({
    where: { planId: plan.id, status: "completed" },
    orderBy: { completedAt: "desc" },
  });
  if (!progressRun) {
    const sourceSnapshot = { seed: true, planId: plan.id, studentIds: students.map((student) => student.id) };
    progressRun = await prisma.trainingProgressCalculationRun.create({
      data: {
        planId: plan.id,
        planVersion: 1,
        status: "completed",
        totalStudents: students.length,
        passStudents: 2,
        failStudents: 1,
        completedAt: new Date(),
        sourceSnapshot,
        sourceSnapshotHash: sha256Hex(JSON.stringify(sourceSnapshot)),
        sourceCapturedAt: new Date(),
      },
    });
    await prisma.trainingProgressStudentResult.createMany({
      data: students.map((student, index) => ({
        runId: progressRun!.id,
        studentId: student.id,
        classId: studentClass.id,
        cohortId: cohort.id,
        sStudentId: student.sStudentId,
        sStudentName: student.sFullName,
        sClassStudentId: studentClass.classId,
        sClassName: studentClass.className,
        sProgramCode: program.sProgramCode,
        status: index === 0 ? "fail" : "pass",
      })),
    });
  }

  let completionRun = await prisma.trainingProgressCompletionRun.findFirst({
    where: {
      cohortId: cohort.id,
      trainingProgramId: program.id,
      assessmentAcademicTermId: term.id,
      status: "completed",
    },
    orderBy: { completedAt: "desc" },
  });
  if (!completionRun) {
    const sourceSnapshot = { seed: true, planIds: [plan.id], studentIds: students.map((student) => student.id) };
    completionRun = await prisma.trainingProgressCompletionRun.create({
      data: {
        cohortId: cohort.id,
        trainingProgramId: program.id,
        assessmentAcademicTermId: term.id,
        status: "completed",
        totalStudents: students.length,
        onTrackStudents: 2,
        behindScheduleStudents: 1,
        completedAt: new Date(),
        publicationStatus: "published",
        sourceSnapshot,
        sourceSnapshotHash: sha256Hex(JSON.stringify(sourceSnapshot)),
        sourceCapturedAt: new Date(),
      },
    });
    await prisma.trainingProgressCompletionStudentResult.createMany({
      data: students.map((student, index) => ({
        runId: completionRun!.id,
        studentId: student.id,
        classId: studentClass.id,
        cohortId: cohort.id,
        sStudentId: student.sStudentId,
        sStudentName: student.sFullName,
        sClassStudentId: studentClass.classId,
        sClassName: studentClass.className,
        sProgramCode: program.sProgramCode,
        scheduleStatus: index === 0 ? "behind_schedule" : "on_track",
        programCompletionStatus: "incomplete",
      })),
    });
  }

  let policy = await prisma.academicWarningPolicy.findFirst({ where: { status: "active" }, orderBy: { version: "desc" } });
  if (!policy) {
    policy = await prisma.academicWarningPolicy.create({
      data: {
        name: "Chính sách cảnh báo demo",
        termGpaThreshold: 2,
        cumulativeGpaThreshold: 2,
        version: 1,
        status: "active",
        createdBy: adminId,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "warning_policy.activate",
        resourceType: "AcademicWarningPolicy",
        resourceId: policy.id,
        details: { source: "seed", version: 1, termGpaThreshold: 2, cumulativeGpaThreshold: 2 },
      },
    });
  }

  const warningRun = await prisma.academicWarningRun.findFirst({
    where: {
      cohortId: cohort.id,
      trainingProgramId: program.id,
      assessmentAcademicTermId: term.id,
      status: "completed",
    },
  });
  if (!warningRun) {
    await AcademicWarningsService.createRun({
      cohortId: cohort.id,
      trainingProgramId: program.id,
      assessmentAcademicTermId: term.id,
      createdBy: adminId,
    });
  }
}

async function main() {
  const accounts = await seedRbac();
  await seedDemoData(accounts.admin.id, accounts.advisor.id);
  console.log("SEWS seed completed.");
  console.log(`Admin: ${accounts.adminUsername}${accounts.adminCreated ? ` / ${accounts.adminPassword}` : " (existing password preserved)"}`);
  console.log(`Advisor demo: ${accounts.advisorUsername}${accounts.advisorCreated ? ` / ${accounts.advisorPassword}` : " (existing password preserved)"}`);
  console.log("Change these passwords immediately outside local demo environments.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
