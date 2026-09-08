import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";
import { evaluate } from "../lib/services/academic-warnings";
import {
  applyElectiveThreshold,
  evaluateCompletionPlan,
  evaluateProgress,
} from "../lib/services/training-progress";
import { hasInvalidUuidSegment, hasPermission, proxy, requiredPermission } from "../proxy";
import { checkLoginAttempt, clearLoginFailures, loginAttemptKey, recordLoginFailure } from "../lib/auth/login-rate-limit";
import { parseCredits, parseDecimal, parseScore10, parseScore4 } from "../lib/services/grades";
import { parsePagination } from "../lib/utils/api-response";

const IDS = {
  student: "11111111-1111-4111-8111-111111111111",
  courseA: "22222222-2222-4222-8222-222222222222",
  courseB: "33333333-3333-4333-8333-333333333333",
  plan: "44444444-4444-4444-8444-444444444444",
  term: "55555555-5555-4555-8555-555555555555",
};

test("API permission policy follows the Phase 2 contract", () => {
  assert.equal(requiredPermission("/api/v1/students", "GET"), "student.read");
  assert.equal(requiredPermission("/api/v1/students/import", "POST"), "student.import");
  assert.equal(requiredPermission("/api/v1/students/x/decisions/y", "DELETE"), "decision.delete");
  assert.equal(requiredPermission("/api/v1/training-progress/plans/x/calculate", "POST"), "progress.calculate");
  assert.equal(requiredPermission("/api/v1/rbac/roles/x/permissions", "PUT"), "role.manage");
  assert.equal(requiredPermission("/api/v1/rbac/advisor-assignments", "POST"), "advisor_assignment.manage");
  assert.equal(requiredPermission("/api/v1/training-progress/completion-runs/preview", "POST"), "progress.calculate");
});

test("Next.js exposes every SWE OpenAPI method and path", () => {
  const root = process.cwd();
  const apiRoot = path.join(root, "app", "api", "v1");
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.name === "route.ts") files.push(absolute);
    }
  };
  visit(apiRoot);

  const actual = new Set<string>();
  for (const file of files) {
    const relative = path.relative(apiRoot, path.dirname(file)).split(path.sep).join("/");
    const routePath = `/${relative}`.replace(/\[([^\]]+)\]/g, "{param}");
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)) {
      actual.add(`${match[1]} ${routePath}`);
    }
    for (const match of source.matchAll(/export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/g)) {
      actual.add(`${match[1]} ${routePath}`);
    }
    for (const match of source.matchAll(/export\s*\{([^}]+)\}\s*from/g)) {
      for (const method of match[1].match(/\b(GET|POST|PUT|PATCH|DELETE)\b/g) || []) {
        actual.add(`${method} ${routePath}`);
      }
    }
  }

  const specification = JSON.parse(fs.readFileSync(
    path.join(root, "SWE", "cntt-portal-v2", "backend", "internal", "httpapi", "docs", "openapi.json"),
    "utf8",
  )) as { paths: Record<string, Record<string, unknown>> };
  const expected = Object.entries(specification.paths).flatMap(([routePath, operations]) =>
    Object.keys(operations)
      .filter((method) => ["get", "post", "put", "patch", "delete"].includes(method))
      .map((method) => `${method.toUpperCase()} ${routePath.replace(/\{[^}]+\}/g, "{param}")}`),
  );
  assert.deepEqual(expected.filter((operation) => !actual.has(operation)), []);
});

test("SWE pagination names and safety limits remain compatible", () => {
  assert.deepEqual(parsePagination(new URLSearchParams("page=2&page_size=25")), {
    page: 2,
    pageSize: 25,
    skip: 25,
    take: 25,
  });
  assert.equal(parsePagination(new URLSearchParams("page_size=999")).pageSize, 100);
});

test("API responses carry a safe correlation request id", async () => {
  const supplied = await proxy(new NextRequest("http://localhost/api/v1/healthz", {
    headers: { "x-request-id": "swe-parity-123" },
  }));
  assert.equal(supplied.headers.get("x-request-id"), "swe-parity-123");

  const replaced = await proxy(new NextRequest("http://localhost/api/v1/healthz", {
    headers: { "x-request-id": "invalid request id" },
  }));
  assert.match(replaced.headers.get("x-request-id") || "", /^[0-9a-f-]{36}$/i);
});

test("grade import rejects malformed numeric data instead of silently storing null", () => {
  assert.deepEqual(parseScore10("VT"), { value: null, special: "VT" });
  assert.deepEqual(parseScore4("3.5"), { value: 3.5, special: "" });
  assert.equal(parseCredits("3"), 3);
  assert.equal(parseDecimal("8.25", 0, 10, "gpa"), 8.25);
  assert.throws(() => parseScore10("ten"), /Invalid score_10/);
  assert.throws(() => parseScore4("4.5"), /Invalid score_4/);
  assert.throws(() => parseCredits("2.5"), /Invalid credits/);
  assert.throws(() => parseDecimal("NaN", 0, 10, "gpa"), /Invalid gpa/);
});

test("admin and explicit grants authorize; unrelated grants do not", () => {
  const base = { sub: "u", username: "u", jti: "j", scopes: [], permissions: [] };
  assert.equal(hasPermission({ ...base, roles: ["admin"] }, "student.delete"), true);
  assert.equal(hasPermission({ ...base, roles: ["staff"], permissions: ["student.read"] }, "student.read"), true);
  assert.equal(hasPermission({ ...base, roles: ["staff"], permissions: ["student.read"] }, "student.delete"), false);
});

test("API boundary rejects malformed UUID path segments", () => {
  assert.equal(hasInvalidUuidSegment("/api/v1/training-progress/plans/not-a-uuid"), true);
  assert.equal(hasInvalidUuidSegment(`/api/v1/training-progress/plans/${IDS.plan}`), false);
  assert.equal(hasInvalidUuidSegment("/api/v1/training-progress/plans/clone-preview"), false);
  assert.equal(hasInvalidUuidSegment("/api/v1/academic-warnings/runs/bad/students"), true);
});

test("login rate limiter blocks the sixth failure and can be reset", () => {
  const key = loginAttemptKey("127.0.0.1", `test-${Date.now()}`);
  for (let index = 0; index < 5; index++) recordLoginFailure(key, 1_000);
  assert.equal(checkLoginAttempt(key, 1_001).allowed, false);
  clearLoginFailures(key);
  assert.equal(checkLoginAttempt(key, 1_001).allowed, true);
});

test("progress evaluation detects missing, outside-plan, and elective-credit gaps", () => {
  const result = evaluateProgress(
    [
      { courseId: IDS.courseA, courseCode: "A", courseName: "A", credits: 3, requirementType: "mandatory", choiceGroupCode: null, isRegistrationRequired: true },
      { courseId: IDS.courseB, courseCode: "B", courseName: "B", credits: 2, requirementType: "elective", choiceGroupCode: null, isRegistrationRequired: false },
    ],
    [{ courseId: IDS.courseB, courseCode: "B", courseName: "B", credits: 2 }],
    false,
  );
  applyElectiveThreshold(result, 3);
  assert.equal(result.status, "fail");
  assert.equal(result.missingMandatoryCourses, 1);
  assert.equal(result.missingCredits, 1);
});

test("completion distinguishes pending results from forecast assumptions", () => {
  const plan = {
    id: IDS.plan,
    version: 1,
    academicTermId: IDS.term,
    academicYearCode: "2026-2027",
    termOrder: 1,
    termCode: "HK01",
    curriculumSemesterNo: 1,
    requiredElective: 0,
    status: "locked",
    isCurrent: true,
    isProgramFinal: false,
    courses: [
      { courseId: IDS.courseA, courseCode: "A", courseName: "A", credits: 3, requirementType: "mandatory", choiceGroupCode: null, isRegistrationRequired: true },
    ],
  };
  const standard = evaluateCompletionPlan(plan, new Map(), true, new Set([IDS.courseA]), true, false);
  assert.equal(standard.isPass, false);
  assert.equal(standard.pendingOnly, true);
  assert.equal(standard.pendingResultCourses, 1);
  const forecast = evaluateCompletionPlan(plan, new Map(), true, new Set([IDS.courseA]), true, true);
  assert.equal(forecast.isPass, true);
  assert.equal(forecast.courses[0].pendingResult, true);
});

test("warning evaluation promotes high-severity cumulative GPA and decision reasons", () => {
  const student = {
    id: IDS.student,
    classId: null,
    cohortId: null,
    code: "SV001",
    name: "Sinh viên",
    classCode: "",
    className: "",
    programCode: "CNTT",
  };
  const summaries = new Map([[IDS.student, {
    registered: 12,
    termGPA4: 1.9,
    termGPA10: 4.8,
    cumulativeGPA4: 1.8,
    cumulativeGPA10: 4.5,
  }]]);
  const decisions = new Map([[IDS.student, [{
    id: IDS.plan,
    number: "QD-01",
    name: "Cảnh báo",
    fullText: "",
    signDate: null,
  }]]]);
  const result = evaluate(student, new Map(), new Map(), summaries, decisions, {
    termGpaThreshold: 2,
    cumulativeGpaThreshold: 2,
  });
  assert.equal(result.maxSeverity, "high");
  assert.deepEqual(result.reasons.map((reason) => reason.reasonCode), [
    "LOW_TERM_GPA",
    "LOW_CUMULATIVE_GPA",
    "ACADEMIC_WARNING_DECISION",
  ]);
});
