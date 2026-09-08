"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import WarningBadge from "@/components/WarningBadge";
import SlideOverDrawer from "@/components/ui/SlideOverDrawer";
import Modal from "@/components/ui/Modal";

type ActiveTab = "overview" | "grades" | "decisions" | "fee_policies" | "registrations" | "training_plan" | "warnings";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("vi-VN");
};

const scheduleLabel = (status?: string | null) => {
  if (status === "on_track") return "Đúng tiến độ";
  if (status === "behind_schedule") return "Chậm tiến độ";
  if (status === "pending_result") return "Chờ kết quả";
  if (status === "no_due_courses") return "Chưa đến hạn đánh giá";
  return "Chưa có kỳ đánh giá";
};

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [summariesData, setSummariesData] = useState<any>(null);
  const [decisionsData, setDecisionsData] = useState<any[]>([]);
  const [feePoliciesData, setFeePoliciesData] = useState<any[]>([]);
  const [registrationsData, setRegistrationsData] = useState<any[]>([]);
  const [trainingPlanData, setTrainingPlanData] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadIssues, setLoadIssues] = useState<string[]>([]);

  // Decision & Fee Policy interactive states
  const [selectedDecisionDetail, setSelectedDecisionDetail] = useState<any | null>(null);
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({
    feeObjectDicId: "MIEN_GIAM_50",
    feeObjectName: "Miễn giảm 50% học phí",
    coefficient: 0.5,
    decisionNumber: "QĐ-DLU-2024",
    yearStudy: "2024-2025",
    termId: "HK01",
  });
  const [feeSubmitting, setFeeSubmitting] = useState(false);

  // Warning Action interactive state
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    actionType: "COUNSELING",
    note: "",
    status: "IN_PROGRESS",
    actorName: "Cố vấn học tập",
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const reloadStudent = async () => {
    const sRes = await fetch(`/api/v1/students/${studentId}`);
    if (sRes.ok) {
      setStudent(await sRes.json());
    }
  };

  useEffect(() => {
    async function loadStudentInfo() {
      if (!studentId) return;
      try {
        setLoading(true);
        setLoadIssues([]);
        const [sRes, dRes, gRes, sumRes, decRes, feeRes, regRes] = await Promise.all([
          fetch(`/api/v1/students/${studentId}`),
          fetch(`/api/v1/students/${studentId}/dashboard`),
          fetch(`/api/v1/students/${studentId}/grades`),
          fetch(`/api/v1/students/${studentId}/grades/summary`),
          fetch(`/api/v1/students/${studentId}/decisions`),
          fetch(`/api/v1/students/${studentId}/fee-policies`),
          fetch(`/api/v1/students/${studentId}/registrations?pageSize=100`),
        ]);

        if (!sRes.ok) throw new Error("Không thể tải hồ sơ sinh viên");
        const sJson = await sRes.json();
        setStudent(sJson);

        const issues: string[] = [];
        if (sJson.program?.id) {
          const planRes = await fetch(`/api/v1/training-programs/${sJson.program.id}/courses`);
          if (planRes.ok) {
            const planJson = await planRes.json();
            setTrainingPlanData(planJson.items || []);
          } else issues.push("khung chương trình đào tạo");
        }
        if (dRes.ok) {
          const dJson = await dRes.json();
          setDashboardData(dJson);
        } else issues.push("tổng quan học vụ");

        if (gRes.ok) {
          const gJson = await gRes.json();
          setGradesData(gJson.items || gJson || []);
        } else issues.push("bảng điểm");

        if (sumRes.ok) {
          const sumJson = await sumRes.json();
          setSummariesData(sumJson);
        } else issues.push("tổng kết điểm");

        if (decRes.ok) {
          const decJson = await decRes.json();
          setDecisionsData(decJson.items || decJson || []);
        } else issues.push("quyết định");

        if (feeRes.ok) {
          const feeJson = await feeRes.json();
          setFeePoliciesData(feeJson.items || feeJson || []);
        } else issues.push("chính sách học phí");

        if (regRes.ok) {
          const regJson = await regRes.json();
          setRegistrationsData(regJson.items || regJson || []);
        } else issues.push("đăng ký học phần");
        setLoadIssues(issues);
      } catch (err) {
        console.error("Error loading student details:", err);
        setLoadIssues([err instanceof Error ? err.message : "Không thể tải hồ sơ sinh viên"]);
      } finally {
        setLoading(false);
      }
    }

    loadStudentInfo();
  }, [studentId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <svg className="animate-spin h-5 w-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Đang tải hồ sơ sinh viên {studentId}...</span>
        </div>
      </div>
    );
  }

  const sCode = student?.studentCode || student?.studentId || dashboardData?.student?.studentId || studentId;
  const sName = student?.fullName || dashboardData?.student?.fullName || "Sinh viên";
  const sClass = student?.className || student?.classStudentId || dashboardData?.student?.className || "Chưa phân lớp";
  const sProgram = student?.program?.code || student?.studyProgramId || dashboardData?.student?.programCode || "Chưa xác định";
  const cumulative = summariesData?.cumulative || student?.cumulative || dashboardData?.cumulative;
  const latestTerm = (summariesData?.terms || []).at(-1);
  const latestConduct = (summariesData?.conductRecords || [])
    .filter((record: any) => record.finalScore != null)
    .at(-1);
  const progressStatus = dashboardData?.completion?.available
    ? scheduleLabel(dashboardData.completion.scheduleStatus)
    : "Chưa có kỳ đánh giá";
  const passedCourseCodes = new Set(
    gradesData.filter((grade: any) => grade.isPassed).map((grade: any) => grade.courseCode),
  );
  const plannedCredits = trainingPlanData.reduce((total: number, course: any) => total + Number(course.credits || 0), 0);
  const completedPlanCredits = trainingPlanData.reduce(
    (total: number, course: any) => total + (passedCourseCodes.has(course.courseCode) ? Number(course.credits || 0) : 0),
    0,
  );

  // GPA Trend data from summaries
  const gpaTrend = (summariesData?.terms || [])
    .filter((t: any) => t.gpa4 != null || t.cumulativeGpa4 != null)
    .map((t: any) => ({
      semester: t.academicYear ? `${t.termCode} ${t.academicYear}` : t.termCode || "HK",
      gpa4: t.gpa4,
      cumGpa4: t.cumulativeGpa4,
    }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb / Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/students")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Quay lại Danh sách Sinh viên</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
            MSSV: <strong>{sCode}</strong>
          </span>
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--color-primary)] to-lime-500 flex items-center justify-center text-white text-2xl font-black shadow-md flex-shrink-0"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {sName.split(" ").pop()?.charAt(0) || "S"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                {sName}
              </h1>
              <WarningBadge level={student?.warningLevel || dashboardData?.warningLevel || "green"} />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
              <span>Lớp: <strong className="text-slate-800">{sClass}</strong></span>
              <span>•</span>
              <span>Chương trình: <strong className="text-slate-800">{student?.program?.name || sProgram}</strong></span>
              <span>•</span>
              <span>Khoa: <strong className="text-slate-800">{student?.program?.facultyCode || "Chưa cập nhật"}</strong></span>
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="bg-[var(--color-surface2)]/70 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">GPA Tích lũy (4)</div>
            <div className="text-xl font-black text-slate-800 font-mono">
              {cumulative?.cumulativeGpa4 != null ? Number(cumulative.cumulativeGpa4).toFixed(2) : "—"}
            </div>
          </div>

          <div className="bg-[var(--color-surface2)]/70 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">GPA Tích lũy (10)</div>
            <div className="text-xl font-black text-slate-800 font-mono">
              {cumulative?.cumulativeGpa10 != null ? Number(cumulative.cumulativeGpa10).toFixed(2) : "—"}
            </div>
          </div>

          <div className="bg-[var(--color-surface2)]/70 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">TC Đạt</div>
            <div className="text-xl font-black text-emerald-600 font-mono">
              {cumulative?.cumulativeCredits ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {loadIssues.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900" role="status">
          <strong>Một số phần chưa tải được:</strong> {loadIssues.join(", ")}. Hãy kiểm tra quyền truy cập hoặc thử tải lại trang.
        </div>
      )}

      {/* 6 Nav Tabs */}
      <div className="flex items-center space-x-1 border-b border-[var(--color-border)] overflow-x-auto scrollbar-hide">
        {[
          { id: "overview", label: "1. Tổng quan", icon: "📊" },
          { id: "grades", label: "2. Điểm học phần", icon: "📝" },
          { id: "decisions", label: "3. Quyết định", icon: "📜" },
          { id: "fee_policies", label: "4. Chính sách học phí", icon: "💰" },
          { id: "registrations", label: "5. Đăng ký học phần", icon: "📚" },
          { id: "training_plan", label: "6. Kế hoạch đào tạo", icon: "🎯" },
          {
            id: "warnings",
            label: "7. Cảnh báo học vụ",
            icon: "⚠️",
            badge: (student?.warningHistory?.length || (student?.warningLevel && student.warningLevel !== "green")) ? "!" : undefined,
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as ActiveTab)}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/40 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Areas */}

      {/* 1. Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GPA Trend Chart (2 cols) */}
            <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                Diễn biến Điểm trung bình (GPA) qua các Học kỳ
              </h3>
              <p className="text-xs text-slate-500 mb-4">Theo dõi GPA học kỳ và GPA tích lũy hệ 4</p>

              <div className="h-64 w-full">
                {gpaTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Chưa có đủ dữ liệu điểm học kỳ để vẽ biểu đồ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gpaTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="semester" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "10px",
                          border: "1px solid #E2E8F0",
                          fontSize: "12px",
                        }}
                      />
                      <Line type="monotone" dataKey="gpa4" name="GPA Học kỳ" stroke="#90C63B" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="cumGpa4" name="GPA Tích lũy" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Academic Info & Warning Status */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Tình trạng Học vụ Hiện tại
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Trạng thái sinh viên:</span>
                  <span className={`font-semibold ${student?.isInClass ? "text-emerald-600" : "text-slate-600"}`}>
                    {student?.isInClass ? "Đang trong lớp" : "Đã rời lớp"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Cố vấn học tập (GVCN):</span>
                  <span className="font-semibold text-slate-800 text-right">{student?.advisor?.fullName || "Chưa phân công"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Mức độ cảnh báo:</span>
                  <WarningBadge level={dashboardData?.warningLevel || "green"} />
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Tiến độ đào tạo:</span>
                  <span className="font-semibold text-slate-800 text-right">{progressStatus}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Số quyết định xử lý:</span>
                  <span className="font-semibold text-slate-800">{decisionsData.length} quyết định</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <section className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Thông tin cá nhân
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Dữ liệu hồ sơ đang lưu trong hệ thống</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{sCode}</span>
              </div>
              <dl className="grid grid-cols-[minmax(7rem,0.8fr)_minmax(0,1.2fr)] gap-x-4 text-xs">
                {[
                  ["Ngày sinh", formatDate(student?.birthDate)],
                  ["Giới tính", student?.gender || "Chưa cập nhật"],
                  ["Nơi sinh", student?.birthPlace || "Chưa cập nhật"],
                  ["Nơi thường trú", student?.permanentResidence || "Chưa cập nhật"],
                  ["Lớp sinh viên", sClass],
                  ["Khóa", student?.cohort?.name || student?.cohort?.code || "Chưa xác định"],
                  ["Vai trò trong lớp", student?.classRoleId === 1 ? "Lớp trưởng" : "Sinh viên"],
                ].map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="py-2.5 border-b border-slate-100 text-slate-500">{label}</dt>
                    <dd className="py-2.5 border-b border-slate-100 font-semibold text-slate-800 text-right break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="lg:col-span-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Chương trình và kết quả gần nhất
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Thông tin đào tạo đối chiếu từ CTĐT và bảng điểm</p>
                </div>
                <span className="self-start rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-700">
                  {sProgram}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <dl className="text-xs">
                  {[
                    ["Tên chương trình", student?.program?.name || "Chưa cập nhật"],
                    ["Ngành/Chuyên ngành", student?.program?.major || "Chưa cập nhật"],
                    ["Trình độ đào tạo", student?.program?.degreeLevel || "Chưa cập nhật"],
                    ["Hình thức đào tạo", student?.program?.studyType || "Chưa cập nhật"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-2.5 border-b border-slate-100">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-semibold text-slate-800 text-right">{value}</dd>
                    </div>
                  ))}
                </dl>

                <dl className="text-xs">
                  <div className="flex justify-between gap-4 py-2.5 border-b border-slate-100">
                    <dt className="text-slate-500">Kỳ có kết quả gần nhất</dt>
                    <dd className="font-semibold text-slate-800 text-right">
                      {latestTerm ? `${latestTerm.termCode} · ${latestTerm.academicYear}` : "Chưa có"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5 border-b border-slate-100">
                    <dt className="text-slate-500">GPA học kỳ (hệ 4)</dt>
                    <dd className="font-mono font-bold text-slate-900">{latestTerm?.gpa4 != null ? Number(latestTerm.gpa4).toFixed(2) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5 border-b border-slate-100">
                    <dt className="text-slate-500">Tín chỉ đăng ký / đạt</dt>
                    <dd className="font-mono font-bold text-slate-900">
                      {latestTerm ? `${latestTerm.registeredCredits ?? "—"} / ${latestTerm.creditsEarned ?? "—"}` : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5 border-b border-slate-100">
                    <dt className="text-slate-500">Điểm rèn luyện gần nhất</dt>
                    <dd className="font-mono font-bold text-slate-900">
                      {latestConduct?.finalScore ?? latestTerm?.conductScore ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-500">Số học phần có dữ liệu</dt>
                    <dd className="font-mono font-bold text-slate-900">{gradesData.length}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 2. Grades Tab */}
      {activeTab === "grades" && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Bảng điểm Chi tiết các Học phần
              </h3>
              <p className="text-xs text-slate-500">Tất cả các môn đã đăng ký, điểm thi hệ 10, hệ 4 và điểm chữ</p>
            </div>
            <a
              href={`/api/v1/students/${studentId}/grades/export`}
              download
              className="px-3.5 py-2 bg-[var(--color-primary)] hover:bg-[#81b234] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Xuất Bảng điểm →
            </a>
          </div>

          {(summariesData?.conductRecords || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">Điểm rèn luyện chính thức</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Dữ liệu theo lớp và học kỳ từ hệ thống đào tạo</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-100">
                      <th className="py-2.5 px-3">Năm học</th>
                      <th className="py-2.5 px-3">Học kỳ</th>
                      <th className="py-2.5 px-3">SV tự chấm</th>
                      <th className="py-2.5 px-3">Lớp duyệt</th>
                      <th className="py-2.5 px-3">Khoa duyệt</th>
                      <th className="py-2.5 px-3">Điểm cuối</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summariesData.conductRecords.map((record: any) => (
                      <tr key={record.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{record.academicYear || "—"}</td>
                        <td className="py-2.5 px-3">{record.termCode || "—"}</td>
                        <td className="py-2.5 px-3 font-mono">{record.studentScore ?? "—"}</td>
                        <td className="py-2.5 px-3 font-mono">{record.classScore ?? "—"}</td>
                        <td className="py-2.5 px-3 font-mono">{record.departmentScore ?? "—"}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{record.finalScore ?? "—"}</td>
                        <td className="py-2.5 px-3 text-slate-500">{record.statusId || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(summariesData?.unscopedGrades || []).length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <h4 className="text-sm font-bold text-amber-900">
                Điểm chưa xác định học kỳ ({summariesData.unscopedGrades.length})
              </h4>
              <p className="text-[11px] text-amber-700 mt-1">
                Nguồn chưa cung cấp năm học hoặc học kỳ, nên các dòng này được bảo toàn nhưng không dùng để tính GPA.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {summariesData.unscopedGrades.map((grade: any) => (
                  <span key={grade.id} className="rounded-lg bg-white border border-amber-200 px-2.5 py-1.5 text-xs text-amber-950">
                    <strong>{grade.courseCode || "Chưa có mã HP"}</strong>
                    {grade.courseName ? ` · ${grade.courseName}` : ""}
                    {grade.credits != null ? ` · ${grade.credits} TC` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--color-surface2)]/50 border-b border-[var(--color-border)] text-slate-500 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-3">Mã HP</th>
                  <th className="py-3 px-3">Tên học phần</th>
                  <th className="py-3 px-3">Số TC</th>
                  <th className="py-3 px-3">Học kỳ</th>
                  <th className="py-3 px-3">Điểm 10</th>
                  <th className="py-3 px-3">Điểm 4</th>
                  <th className="py-3 px-3">Điểm chữ</th>
                  <th className="py-3 px-3">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradesData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Chưa có dữ liệu điểm học phần.
                    </td>
                  </tr>
                ) : (
                  gradesData.map((g: any, i: number) => (
                    <tr key={g.id || i} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{g.courseCode}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{g.courseName}</td>
                      <td className="py-3 px-3 font-mono">{g.credits}</td>
                      <td className="py-3 px-3 text-slate-500">{g.termCode} ({g.academicYear})</td>
                      <td className="py-3 px-3 font-mono font-semibold">{g.score10 ?? "—"}</td>
                      <td className="py-3 px-3 font-mono font-semibold">{g.score4 ?? "—"}</td>
                      <td className="py-3 px-3 font-mono font-bold">{g.letterGrade || "—"}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          g.isPassed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {g.isPassed ? "Đạt" : "Không đạt"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Decisions Tab */}
      {activeTab === "decisions" && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Danh sách Quyết định Quản lý
              </h3>
              <p className="text-xs text-slate-500">Các quyết định học vụ, khen thưởng, kỷ luật, cảnh báo học tập</p>
            </div>
            <a
              href={`/api/v1/students/${studentId}/decisions/export`}
              download
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Xuất danh sách →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--color-surface2)]/50 border-b border-[var(--color-border)] text-slate-500 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-3">Số quyết định</th>
                  <th className="py-3 px-3">Tên quyết định</th>
                  <th className="py-3 px-3">Ngày ký</th>
                  <th className="py-3 px-3">Học kỳ áp dụng</th>
                  <th className="py-3 px-3">Cảnh báo học vụ</th>
                  <th className="py-3 px-3">Nội dung tóm tắt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decisionsData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Sinh viên chưa có quyết định xử lý hoặc khen thưởng nào.
                    </td>
                  </tr>
                ) : (
                  decisionsData.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{d.decisionNumber || d.sDecisionNumber}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{d.decisionName || d.sDecisionName}</td>
                      <td className="py-3 px-3 text-slate-500">{d.signDate ? new Date(d.signDate).toLocaleDateString("vi-VN") : "—"}</td>
                      <td className="py-3 px-3 text-slate-500">{d.termCode || d.sTermId}</td>
                      <td className="py-3 px-3">
                        {d.isAcademicWarning ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700">
                            Cảnh báo học vụ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Khác
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{d.reason || d.fullText || d.sFullText || "—"}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedDecisionDetail(d)}
                          className="px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Toàn văn →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Fee Policies Tab */}
      {activeTab === "fee_policies" && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Chính sách Miễn giảm Học phí
              </h3>
              <p className="text-xs text-slate-500">Đối tượng chính sách, tỷ lệ miễn giảm và quyết định phê duyệt</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddFeeModal(true)}
                className="px-3.5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                + Gán chính sách mới
              </button>
              <a
                href={`/api/v1/students/${studentId}/fee-policies/export`}
                download
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Xuất danh sách →
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--color-surface2)]/50 border-b border-[var(--color-border)] text-slate-500 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-3">Tên chính sách / Đối tượng</th>
                  <th className="py-3 px-3">Tỷ lệ miễn giảm</th>
                  <th className="py-3 px-3">Năm học / Học kỳ</th>
                  <th className="py-3 px-3">Số quyết định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feePoliciesData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Sinh viên không thuộc diện miễn giảm học phí trong học kỳ này.
                    </td>
                  </tr>
                ) : (
                  feePoliciesData.map((f: any) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{f.feeObjectDicName || f.sFeeObjectDicName}</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold font-mono">
                          {f.coefficientPercent || f.sCoefficient}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{f.termCode || f.sTermId} ({f.academicYear || f.sYearStudy})</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">{f.decisionNumber || f.sDecisionNumber || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Registrations Tab */}
      {activeTab === "registrations" && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Đăng ký Học phần trong Học kỳ
            </h3>
            <p className="text-xs text-slate-500">Danh sách các lớp học phần sinh viên đã đăng ký tham gia</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--color-surface2)]/50 border-b border-[var(--color-border)] text-slate-500 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-3">Mã học phần</th>
                  <th className="py-3 px-3">Tên môn học</th>
                  <th className="py-3 px-3">Số tín chỉ</th>
                  <th className="py-3 px-3">Năm học / Học kỳ</th>
                  <th className="py-3 px-3">Thời gian ghi nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrationsData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có dữ liệu đăng ký học phần cho sinh viên này.
                    </td>
                  </tr>
                ) : (
                  registrationsData.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{r.courseCode}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{r.courseName}</td>
                      <td className="py-3 px-3 font-mono">{r.credits} TC</td>
                      <td className="py-3 px-3 text-slate-500">
                        {r.termCode && r.academicYear ? `${r.termCode} • ${r.academicYear}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Training plan tab */}
      {activeTab === "training_plan" && (
        <div className="space-y-5">
          <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Khung chương trình đào tạo
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {student?.program?.name || sProgram} · đối chiếu với kết quả học phần hiện có
                </p>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <div className="min-w-28 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <span className="block text-[10px] text-slate-500">Học phần CTĐT</span>
                  <strong className="font-mono text-lg text-slate-900">{trainingPlanData.length}</strong>
                </div>
                <div className="min-w-28 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <span className="block text-[10px] text-slate-500">Tín chỉ kế hoạch</span>
                  <strong className="font-mono text-lg text-slate-900">{plannedCredits}</strong>
                </div>
                <div className="min-w-28 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <span className="block text-[10px] text-emerald-700">Đã đạt trong CTĐT</span>
                  <strong className="font-mono text-lg text-emerald-800">{completedPlanCredits}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-3">HK kế hoạch</th>
                    <th className="py-3 px-3">Mã HP</th>
                    <th className="py-3 px-3">Tên học phần</th>
                    <th className="py-3 px-3">TC</th>
                    <th className="py-3 px-3">Loại</th>
                    <th className="py-3 px-3">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainingPlanData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Chưa có khung học phần cho chương trình này.
                      </td>
                    </tr>
                  ) : trainingPlanData.map((course: any) => {
                    const passed = passedCourseCodes.has(course.courseCode);
                    return (
                      <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-slate-600">Học kỳ {course.semesterNo}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{course.courseCode}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{course.courseName}</td>
                        <td className="py-3 px-3 font-mono">{course.credits}</td>
                        <td className="py-3 px-3 text-slate-600">{course.requirementType || "—"}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            passed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {passed ? "Đã đạt" : "Chưa đạt"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* 7. TAB CẢNH BÁO HỌC VỤ & CAN THIỆP */}
      {activeTab === "warnings" && (
        <div className="space-y-6">
          {/* Top Banner & Quick Status */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            student?.warningLevel === "red"
              ? "bg-red-50/80 border-red-200"
              : student?.warningLevel === "yellow"
              ? "bg-amber-50/80 border-amber-200"
              : "bg-emerald-50/80 border-emerald-200"
          }`}>
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5">
                <WarningBadge level={student?.warningLevel || "green"} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {student?.warningLevel === "red"
                    ? "Sinh viên thuộc diện Nguy cơ cao (Cảnh báo Đỏ)"
                    : student?.warningLevel === "yellow"
                    ? "Sinh viên thuộc diện Cần lưu ý theo dõi (Cảnh báo Vàng)"
                    : "Sinh viên trong tình trạng học vụ An toàn (Mức Xanh)"}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {student?.warningLevel === "red"
                    ? "Cần khẩn trương liên hệ, tư vấn lộ trình học tập và ghi nhận hành động can thiệp theo quy chế."
                    : student?.warningLevel === "yellow"
                    ? "Có dấu hiệu nợ học phần hoặc GPA giảm, cố vấn học tập cần theo dõi và đôn đốc sinh viên."
                    : "Tiến độ đào tạo và kết quả tích lũy đảm bảo theo khung chương trình đào tạo."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowActionModal(true)}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Ghi nhận can thiệp mới</span>
            </button>
          </div>

          {/* Metric Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Số lần bị cảnh báo</span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                {student?.warningHistory?.length || 0}
              </span>
              <span className="text-[11px] text-slate-500">Đợt quét hệ thống</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Quyết định cảnh báo</span>
              <span className="text-2xl font-bold font-mono text-purple-700 mt-1 block">
                {student?.warningInfo?.academicWarningDecisions || 0}
              </span>
              <span className="text-[11px] text-slate-500">Văn bản ban hành</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">GPA kỳ gần nhất</span>
              <span className="text-2xl font-bold font-mono text-red-600 mt-1 block">
                {student?.warningInfo?.termGpa4 ? student.warningInfo.termGpa4.toFixed(2) : "—"}
              </span>
              <span className="text-[11px] text-slate-500">Thang điểm 4.0</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lượt đã can thiệp</span>
              <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
                {student?.warningActions?.length || 0}
              </span>
              <span className="text-[11px] text-slate-500">Buổi tư vấn / Gặp gỡ</span>
            </div>
          </div>

          {/* Detailed Reasons / Triggers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Các nguyên nhân kích hoạt cảnh báo gần nhất
              </h3>
              <span className="text-xs text-slate-400">
                {student?.warningReasons?.length || 0} tiêu chí vi phạm
              </span>
            </div>

            {(!student?.warningReasons || student.warningReasons.length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Sinh viên không có nguyên nhân cảnh báo vi phạm học vụ nào trong đợt quét gần nhất.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {student.warningReasons.map((r: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        {r.title || r.reasonCode}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        {r.severity === "high" ? "Mức cao" : "Mức TB"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {r.reasonCode === "LOW_TERM_GPA"
                        ? `Điểm GPA học kỳ của sinh viên chưa đạt chuẩn tối thiểu (đạt ${r.details?.gpa4 ?? student?.warningInfo?.termGpa4 ?? "—"}).`
                        : r.reasonCode === "LOW_CUMULATIVE_GPA"
                        ? `Điểm GPA tích lũy toàn khóa chưa đạt chuẩn (đạt ${r.details?.gpa4 ?? student?.warningInfo?.cumulativeGpa4 ?? "—"}).`
                        : r.reasonCode === "REGISTRATION_BEHIND"
                        ? "Sinh viên không đăng ký đủ số tín chỉ tối thiểu theo kế hoạch học kỳ."
                        : r.reasonCode === "PROGRAM_PROGRESS_BEHIND"
                        ? "Sinh viên bị chậm hoặc nợ các học phần tiên quyết theo tiến độ CTĐT."
                        : "Phát hiện tín hiệu bất thường trong hồ sơ học vụ."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning Run History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Lịch sử các đợt quét cảnh báo của sinh viên
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {student?.warningHistory?.length || 0} đợt ghi nhận
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-3 px-4">Thời điểm quét</th>
                    <th className="py-3 px-4">Mức độ rủi ro</th>
                    <th className="py-3 px-4">GPA Kỳ</th>
                    <th className="py-3 px-4">GPA Tích lũy</th>
                    <th className="py-3 px-4">Đăng ký HP</th>
                    <th className="py-3 px-4">Tiến độ CTĐT</th>
                    <th className="py-3 px-4 text-center">Quyết định VP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!student?.warningHistory || student.warningHistory.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có lịch sử cảnh báo học vụ cho sinh viên này.
                      </td>
                    </tr>
                  ) : (
                    student.warningHistory.map((w: any) => (
                      <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {w.createdAt ? new Date(w.createdAt).toLocaleString("vi-VN") : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            w.maxSeverity === "high"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : w.maxSeverity === "medium"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {w.maxSeverity === "high" ? "Nguy cơ cao (Đỏ)" : w.maxSeverity === "medium" ? "Cần lưu ý (Vàng)" : "Bình thường"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-red-600">
                          {w.termGpa4 ? w.termGpa4.toFixed(2) : "—"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {w.cumulativeGpa4 ? w.cumulativeGpa4.toFixed(2) : "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 capitalize">
                          {w.registrationStatus || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 capitalize">
                          {w.scheduleStatus || "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-bold font-mono">
                          {w.academicWarningDecisions || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Intervention Log & Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Nhật ký Can thiệp & Hỗ trợ (Closed-loop Intervention Log)
                </h3>
                <p className="text-xs text-slate-500">Ghi nhận các buổi tư vấn, gặp gỡ sinh viên và phương án theo dõi</p>
              </div>
              <button
                type="button"
                onClick={() => setShowActionModal(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Thêm buổi tư vấn</span>
              </button>
            </div>

            <div className="p-5">
              {(!student?.warningActions || student.warningActions.length === 0) ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa có nhật ký can thiệp nào được ghi nhận cho sinh viên này.
                </div>
              ) : (
                <div className="space-y-4">
                  {student.warningActions.map((act: any) => (
                    <div key={act.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            act.actionType === "MEETING"
                              ? "bg-blue-100 text-blue-800"
                              : act.actionType === "NOTIFY_EMAIL"
                              ? "bg-orange-100 text-orange-800"
                              : act.actionType === "SCHEDULE_MEETING"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {act.actionType === "MEETING"
                              ? "Gặp trực tiếp"
                              : act.actionType === "NOTIFY_EMAIL"
                              ? "Gửi email cảnh báo"
                              : act.actionType === "SCHEDULE_MEETING"
                              ? "Lịch hẹn làm việc"
                              : "Tư vấn học vụ"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            act.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : act.status === "ESCALATED"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {act.status === "RESOLVED" ? "Đã giải quyết" : act.status === "ESCALATED" ? "Báo cấp trên (Escalated)" : "Đang theo dõi"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {act.actorName || "Cán bộ phụ trách"} • {act.createdAt ? new Date(act.createdAt).toLocaleString("vi-VN") : "—"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed pt-1 whitespace-pre-wrap">
                          {act.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SlideOver Drawer: Toàn văn Quyết định */}
      <SlideOverDrawer
        isOpen={Boolean(selectedDecisionDetail)}
        onClose={() => setSelectedDecisionDetail(null)}
        title={selectedDecisionDetail?.decisionName || "Chi tiết Quyết định"}
        subtitle={`Số: ${selectedDecisionDetail?.decisionNumber || selectedDecisionDetail?.sDecisionNumber || "—"}`}
        width="xl"
      >
        {selectedDecisionDetail && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Ngày ban hành</span>
                <span className="font-bold text-slate-800">
                  {selectedDecisionDetail.signDate ? new Date(selectedDecisionDetail.signDate).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Người ký</span>
                <span className="font-bold text-slate-800">{selectedDecisionDetail.signStaff || "Ban Giám hiệu"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Học kỳ áp dụng</span>
                <span className="font-bold text-slate-800">{selectedDecisionDetail.termCode || selectedDecisionDetail.sTermId || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phân loại</span>
                <span className={selectedDecisionDetail.isAcademicWarning ? "text-red-700 font-bold" : "text-slate-700 font-bold"}>
                  {selectedDecisionDetail.isAcademicWarning ? "⚠️ Cảnh báo học vụ" : "Khen thưởng / Khác"}
                </span>
              </div>
            </div>

            {selectedDecisionDetail.reason && (
              <div className="space-y-1">
                <span className="font-bold text-slate-800">Lý do ban hành / Căn cứ:</span>
                <p className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 leading-relaxed">
                  {selectedDecisionDetail.reason}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span className="font-bold text-slate-800">Toàn văn nội dung quyết định:</span>
              <div className="p-4 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {selectedDecisionDetail.fullText || selectedDecisionDetail.sFullText || "Nội dung đang được cập nhật từ hệ thống hồ sơ đào tạo."}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* Modal: Gán Chính sách Miễn giảm Học phí */}
      <Modal
        isOpen={showAddFeeModal}
        onClose={() => setShowAddFeeModal(false)}
        title="Gán Chính sách Miễn giảm Học phí"
        maxWidth="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setFeeSubmitting(true);
              const res = await fetch(`/api/v1/students/${studentId}/fee-policies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(feeForm),
              });
              if (res.ok) {
                setShowAddFeeModal(false);
                alert("Đã gán chính sách thành công!");
                // Reload fee policies
                const fRes = await fetch(`/api/v1/students/${studentId}/fee-policies`);
                if (fRes.ok) {
                  const json = await fRes.json();
                  setFeePoliciesData(json.items || json || []);
                }
              } else {
                alert("Lỗi khi lưu chính sách học phí");
              }
            } catch (err) {
              console.error(err);
            } finally {
              setFeeSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Đối tượng chính sách</label>
            <select
              value={feeForm.feeObjectDicId}
              onChange={(e) => {
                const val = e.target.value;
                const name = e.target.options[e.target.selectedIndex].text;
                const coef = val === "MIEN_100" ? 1.0 : val === "GIAM_70" ? 0.7 : 0.5;
                setFeeForm({ ...feeForm, feeObjectDicId: val, feeObjectName: name, coefficient: coef });
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            >
              <option value="MIEN_100">Miễn 100% học phí (Đối tượng ưu tiên 1)</option>
              <option value="GIAM_70">Giảm 70% học phí (Con hộ nghèo, cận nghèo)</option>
              <option value="MIEN_GIAM_50">Giảm 50% học phí (Con cán bộ, diện khó khăn)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hệ số miễn giảm</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={feeForm.coefficient}
                onChange={(e) => setFeeForm({ ...feeForm, coefficient: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số quyết định</label>
              <input
                type="text"
                required
                value={feeForm.decisionNumber}
                onChange={(e) => setFeeForm({ ...feeForm, decisionNumber: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                placeholder="VD: 104/QĐ-ĐHĐL"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học</label>
              <input
                type="text"
                value={feeForm.yearStudy}
                onChange={(e) => setFeeForm({ ...feeForm, yearStudy: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Học kỳ áp dụng</label>
              <select
                value={feeForm.termId}
                onChange={(e) => setFeeForm({ ...feeForm, termId: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="HK01">Học kỳ 1 (HK01)</option>
                <option value="HK02">Học kỳ 2 (HK02)</option>
                <option value="HK03">Học kỳ hè (HK03)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddFeeModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={feeSubmitting}
              className="px-5 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
            >
              {feeSubmitting ? "Đang lưu..." : "Lưu chính sách"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ghi nhận Hành động Can thiệp Cảnh báo Sớm */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title="Ghi nhận Hành động Can thiệp & Hỗ trợ Sinh viên"
        description="Lưu vết trao đổi, tư vấn kế hoạch học tập hoặc chuyển cấp quản lý theo dõi"
        maxWidth="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!actionForm.note.trim()) {
              alert("Vui lòng nhập nội dung ghi chú can thiệp!");
              return;
            }
            try {
              setActionSubmitting(true);
              const res = await fetch("/api/v1/academic-warnings/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId: student?.id || studentId,
                  actionType: actionForm.actionType,
                  note: actionForm.note.trim(),
                  actorName: actionForm.actorName,
                  status: actionForm.status,
                }),
              });

              if (res.ok) {
                setShowActionModal(false);
                setActionForm({
                  actionType: "COUNSELING",
                  note: "",
                  status: "IN_PROGRESS",
                  actorName: "Cố vấn học tập",
                });
                alert("Đã lưu nhật ký can thiệp học vụ thành công!");
                await reloadStudent();
              } else {
                alert("Lỗi khi lưu can thiệp");
              }
            } catch (err) {
              console.error(err);
              alert("Lỗi kết nối");
            } finally {
              setActionSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Loại can thiệp</label>
            <select
              value={actionForm.actionType}
              onChange={(e) => setActionForm({ ...actionForm, actionType: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            >
              <option value="COUNSELING">Tư vấn học vụ / Kế hoạch đăng ký</option>
              <option value="MEETING">Mời gặp gỡ trực tiếp</option>
              <option value="NOTIFY_EMAIL">Gửi email đôn đốc / cảnh báo</option>
              <option value="SCHEDULE_MEETING">Lên lịch hẹn làm việc</option>
              <option value="OTHER">Hành động hỗ trợ khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái theo dõi</label>
            <select
              value={actionForm.status}
              onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            >
              <option value="IN_PROGRESS">Đang theo dõi (Chưa cải thiện nhiều)</option>
              <option value="RESOLVED">Đã ổn định / Giải quyết xong</option>
              <option value="ESCALATED">Báo cáo cấp trên / Lãnh đạo Khoa (Leo thang)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Người ghi nhận / Cán bộ xử lý</label>
            <input
              type="text"
              required
              value={actionForm.actorName}
              onChange={(e) => setActionForm({ ...actionForm, actorName: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung chi tiết buổi gặp / Phương án hỗ trợ</label>
            <textarea
              rows={4}
              required
              placeholder="VD: Đã trao đổi cùng sinh viên, hướng dẫn đăng ký trả nợ 2 môn Toán rời rạc và Lập trình nâng cao, giảm tải môn mới còn 14 tín chỉ..."
              value={actionForm.note}
              onChange={(e) => setActionForm({ ...actionForm, note: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowActionModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={actionSubmitting}
              className="px-5 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
            >
              {actionSubmitting ? "Đang lưu..." : "Lưu nhật ký can thiệp"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
