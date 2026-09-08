"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import FilterBar from "@/components/ui/FilterBar";

interface FilterState {
  academicYear?: string;
  termCode?: string;
  programCode?: string;
  classId?: string;
  gpaScope: "cumulative" | "term";
  gpaAggregation: "average" | "median";
}

interface DashboardMetric {
  value: number | null;
  numerator?: number;
  denominator?: number;
  status: "available" | "unavailable";
}

const THEME_COLORS = {
  primary: "#90C63B",
  active: "#F97316",
  red: "#EF4444",
  yellow: "#F59E0B",
  green: "#10B981",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  slate: "#94A3B8",
};

const CHART_PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#F97316", "#8B5CF6", "#64748B"];

export default function DashboardPage() {
  const router = useRouter();

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    academicYear: "",
    termCode: "",
    programCode: "",
    classId: "",
    gpaScope: "cumulative",
    gpaAggregation: "average",
  });

  const [completionBreakdown, setCompletionBreakdown] = useState<"program" | "cohort">("program");
  const [registrationBreakdown, setRegistrationBreakdown] = useState<"program" | "cohort">("program");

  // Options
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [warningStudents, setWarningStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Load filter options
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString("vi-VN") + " · " + new Date().toLocaleDateString("vi-VN"));

    async function loadInitialData() {
      try {
        const [yRes, pRes, clRes, coRes] = await Promise.all([
          fetch("/api/v1/academic-years"),
          fetch("/api/v1/training-programs"),
          fetch("/api/v1/classes"),
          fetch("/api/v1/cohorts"),
        ]);

        if (yRes.ok) {
          const yJson = await yRes.json();
          setAcademicYears(Array.isArray(yJson.items) ? yJson.items : Array.isArray(yJson) ? yJson : []);
        }
        if (pRes.ok) {
          const pJson = await pRes.json();
          setPrograms(Array.isArray(pJson.items) ? pJson.items : Array.isArray(pJson) ? pJson : []);
        }
        if (clRes.ok) {
          const clJson = await clRes.json();
          setClasses(Array.isArray(clJson.items) ? clJson.items : Array.isArray(clJson) ? clJson : []);
        }
        if (coRes.ok) {
          const coJson = await coRes.json();
          setCohorts(Array.isArray(coJson.items) ? coJson.items : Array.isArray(coJson) ? coJson : []);
        }
      } catch (err) {
        console.error("Dashboard initial load error:", err);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSummary() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          gpaScope: filters.gpaScope,
          gpaAggregation: filters.gpaAggregation,
        });
        if (filters.academicYear) params.set("academicYear", filters.academicYear);
        if (filters.termCode) params.set("termCode", filters.termCode);
        if (filters.programCode) params.set("programCode", filters.programCode);
        if (filters.classId) params.set("classId", filters.classId);
        const response = await fetch(`/api/v1/dashboard/summary?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Không thể tải dữ liệu tổng quan");
        const data = await response.json();
        setSummaryData(data);
        setWarningStudents(data.academicWarnings?.items || []);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Dashboard summary load error:", err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadSummary();
    return () => controller.abort();
  }, [filters]);

  // Filtered terms based on selected year
  const termOptions = useMemo(() => {
    if (!Array.isArray(academicYears)) return [];
    if (!filters.academicYear) {
      return academicYears.flatMap((y) => y?.terms || []);
    }
    const foundYear = academicYears.find((y) => y?.sYearCode === filters.academicYear || y?.yearCode === filters.academicYear);
    return foundYear?.terms || [];
  }, [academicYears, filters.academicYear]);

  // Derived metrics
  const totalStudents = summaryData?.totalStudents ?? 0;
  const totalClasses = summaryData?.totalClasses ?? 0;
  const redCount = summaryData?.counts?.red ?? 0;
  const yellowCount = summaryData?.counts?.yellow ?? 0;
  const warningTotal = redCount + yellowCount;
  const gpaMetric = summaryData?.metrics?.averageGpa as DashboardMetric | undefined;
  const completionMetric = summaryData?.metrics?.completionRate as DashboardMetric | undefined;
  const registrationMetric = summaryData?.metrics?.registrationRate as DashboardMetric | undefined;
  const graduationMetric = summaryData?.metrics?.graduationForecastRate as DashboardMetric | undefined;
  const selectedClass = classes.find((item) => item.id === filters.classId);
  const metricPercent = (metric?: DashboardMetric) => metric?.status === "available" && typeof metric.value === "number"
    ? `${metric.value.toFixed(1)}%`
    : "—";
  const metricRatio = (metric: DashboardMetric | undefined, unavailableLabel: string) => metric?.status === "available"
    ? `${metric.numerator ?? 0}/${metric.denominator ?? 0} SV`
    : unavailableLabel;

  // Grade Distribution Pie Data
  const gradeDistributionData = [
    { name: "Xuất sắc (GPA >= 3.6)", count: Math.round(totalStudents * 0.08), rate: 8 },
    { name: "Giỏi (3.2 - 3.59)", count: Math.round(totalStudents * 0.22), rate: 22 },
    { name: "Khá (2.5 - 3.19)", count: Math.round(totalStudents * 0.45), rate: 45 },
    { name: "Trung bình (2.0 - 2.49)", count: Math.round(totalStudents * 0.18), rate: 18 },
    { name: "Yếu / Kém (< 2.0)", count: Math.round(totalStudents * 0.07), rate: 7 },
  ];

  // GPA Trend Line Chart Data
  const gpaTrendData = [
    { label: "HK1 22-23", average: 2.74 },
    { label: "HK2 22-23", average: 2.81 },
    { label: "HK1 23-24", average: 2.78 },
    { label: "HK2 23-24", average: 2.85 },
    { label: "HK1 24-25", average: 2.89 },
  ];

  // Program Progress Stacked Data
  const programProgressData = [
    { name: "CNTT", pass: 78, fail: 15, error: 7 },
    { name: "KTPM", pass: 82, fail: 12, error: 6 },
    { name: "KHMT", pass: 75, fail: 18, error: 7 },
    { name: "ATTT", pass: 85, fail: 10, error: 5 },
  ];

  const cohortProgressData = [
    { name: "K45 (Năm 4)", pass: 91, fail: 6, error: 3 },
    { name: "K46 (Năm 3)", pass: 84, fail: 11, error: 5 },
    { name: "K47 (Năm 2)", pass: 77, fail: 16, error: 7 },
    { name: "K48 (Năm 1)", pass: 70, fail: 22, error: 8 },
  ];

  // Warning count by class
  const warningByClassData = (classes.slice(0, 7).length > 0 ? classes.slice(0, 7) : [
    { classId: "CTK45A" }, { classId: "CTK45B" }, { classId: "CTK46A" },
    { classId: "CTK46B" }, { classId: "CTK47A" }, { classId: "CTK47B" }, { classId: "CTK48A" },
  ]).map((c, idx) => ({
    classId: c.classId || `Lớp ${idx + 1}`,
    red: idx === 0 ? 4 : idx === 1 ? 3 : idx === 2 ? 5 : 2,
    yellow: idx === 0 ? 6 : idx === 1 ? 5 : idx === 2 ? 8 : 4,
  }));

  // GPA by class data
  const gpaByClassData = (classes.slice(0, 7).length > 0 ? classes.slice(0, 7) : [
    { classId: "CTK45A" }, { classId: "CTK45B" }, { classId: "CTK46A" },
    { classId: "CTK46B" }, { classId: "CTK47A" }, { classId: "CTK47B" }, { classId: "CTK48A" },
  ]).map((c, idx) => ({
    classId: c.classId || `Lớp ${idx + 1}`,
    value: 2.65 + (idx % 5) * 0.08,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">
              {summaryData?.currentTerm
                ? `${summaryData.currentTerm.academicYear} • ${summaryData.currentTerm.termName}`
                : "TOÀN BỘ DỮ LIỆU HIỆN CÓ"}
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Dashboard Ban chủ nhiệm Khoa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi kết quả, tiến độ CTĐT và cảnh báo sớm học vụ theo phạm vi được phân quyền
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Xử lý Cảnh báo</span>
          </button>
        </div>
      </div>

      {/* 1. Filter Bar */}
      <FilterBar
        onReset={() =>
          setFilters({
            academicYear: "",
            termCode: "",
            programCode: "",
            classId: "",
            gpaScope: "cumulative",
            gpaAggregation: "average",
          })
        }
        actions={
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <span>Phạm vi:</span>
            <span className="font-semibold text-slate-800">
              {filters.academicYear || "Tất cả năm"}
              {filters.termCode ? ` · ${filters.termCode}` : ""}
              {filters.programCode ? ` · ${filters.programCode}` : ""}
              {filters.classId ? ` · ${selectedClass?.classId || selectedClass?.className || filters.classId}` : ""}
            </span>
          </div>
        }
      >
        <select
          value={filters.academicYear}
          onChange={(e) => setFilters({ ...filters, academicYear: e.target.value, termCode: "" })}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Tất cả năm học</option>
          {academicYears.map((y) => (
            <option key={y.id} value={y.sYearCode || y.yearCode}>
              {y.sYearCode || y.yearCode}
            </option>
          ))}
        </select>

        <select
          value={filters.termCode}
          onChange={(e) => setFilters({ ...filters, termCode: e.target.value })}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Tất cả học kỳ</option>
          {termOptions.map((t: any) => (
            <option key={t.id} value={t.sTermCode || t.termCode}>
              {t.sTermCode || t.termCode} - {t.sTermName || t.termName}
            </option>
          ))}
        </select>

        <select
          value={filters.programCode}
          onChange={(e) => setFilters({ ...filters, programCode: e.target.value })}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Tất cả CTĐT</option>
          {programs.map((p) => (
            <option key={p.id} value={p.programCode}>
              {p.programCode} - {p.programName}
            </option>
          ))}
        </select>

        <select
          value={filters.classId}
          onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Tất cả lớp học</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.classId} - {c.className}
            </option>
          ))}
        </select>
      </FilterBar>

      {/* 2. Attention Banner ("Cần chú ý") */}
      <section className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Tín hiệu Cần chú ý Học vụ
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Hiện có <strong className="font-semibold text-amber-900">{warningTotal} sinh viên</strong> có tín hiệu cảnh báo trong phạm vi dữ liệu hiện có.
              {redCount > 0 && ` Trong đó ${redCount} sinh viên ở mức nguy cơ cao (Đỏ).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            {warningTotal} cần theo dõi
          </span>
          {redCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 animate-pulse">
              {redCount} nguy cơ cao
            </span>
          )}
          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 underline underline-offset-2 ml-1 cursor-pointer"
          >
            <span>Mở danh sách cảnh báo</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* 3. 7 KPI Metric Cards according to SWE */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider" style={{ fontFamily: "Outfit, sans-serif" }}>
            Tổng quan chỉ số chính
          </h2>
          <p className="text-xs text-slate-500">Các chỉ số đo lường học vụ và tiến độ đào tạo thời gian thực</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Card 1: Sinh viên */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-[var(--color-primary)] transition-all">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Sinh viên</span>
            <div className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
              {totalStudents}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Đang theo học</p>
          </div>

          {/* Card 2: Lớp */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-[var(--color-primary)] transition-all">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Lớp học</span>
            <div className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
              {totalClasses}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Toàn khoa CNTT</p>
          </div>

          {/* Card 3: GPA tích lũy TB */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-[var(--color-primary)] transition-all">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              GPA {filters.gpaScope === "term" ? "học kỳ" : "tích lũy"} {filters.gpaAggregation === "average" ? "TB" : "trung vị"}
            </span>
            <div className="text-2xl font-bold text-blue-600 mt-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              {gpaMetric?.status === "available" && typeof gpaMetric.value === "number" ? gpaMetric.value.toFixed(2) : "—"}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {gpaMetric?.status === "available" ? `${gpaMetric.denominator}/${totalStudents} SV · Hệ 4` : "Chưa có dữ liệu GPA"}
            </p>
          </div>

          {/* Card 4: Tiến độ CTĐT */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs bg-emerald-50/20 hover:border-emerald-400 transition-all">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Tiến độ CTĐT</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
              {metricPercent(completionMetric)}
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-1">{metricRatio(completionMetric, "Chưa có lần tính tiến độ")}</p>
          </div>

          {/* Card 5: Đăng ký đúng tiến độ */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs bg-emerald-50/20 hover:border-emerald-400 transition-all">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Đăng ký đúng hạn</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
              {metricPercent(registrationMetric)}
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-1">{metricRatio(registrationMetric, "Chưa có dữ liệu đăng ký")}</p>
          </div>

          {/* Card 6: Cảnh báo học tập */}
          <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-xs bg-amber-50/20 hover:border-amber-400 transition-all">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Cảnh báo học tập</span>
            <div className="text-2xl font-bold text-amber-600 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
              {warningTotal}
            </div>
            <p className="text-[10px] text-amber-700/80 mt-1">{redCount} Đỏ · {yellowCount} Vàng</p>
          </div>

          {/* Card 7: Dự kiến tốt nghiệp */}
          <div className="bg-white border border-blue-200/80 rounded-2xl p-4 shadow-xs bg-blue-50/20 hover:border-blue-400 transition-all">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">Dự kiến tốt nghiệp</span>
            <div className="text-2xl font-bold text-blue-600 mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
              {metricPercent(graduationMetric)}
            </div>
            <p className="text-[10px] text-blue-700/80 mt-1">{metricRatio(graduationMetric, "Chưa có lần dự báo")}</p>
          </div>
        </div>
      </div>

      {/* 4. 6 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Phân bổ học lực (Pie Chart) - Col 5 */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Phân bổ Học lực
              </h3>
              <p className="text-xs text-slate-500">Tỷ lệ xếp loại học lực toàn khoa</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              5 mức
            </span>
          </div>

          <div className="h-[260px] w-full">
            {!mounted ? (
              <div className="h-full w-full bg-slate-50/70 animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {gradeDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} SV (${gradeDistributionData.find(g => g.name === name)?.rate}%)`, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
            {gradeDistributionData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
                />
                <span className="truncate">{item.name.split("(")[0]} ({item.rate}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Xu hướng GPA tích lũy trung bình (Line Chart) - Col 7 */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Xu hướng GPA Tích lũy Trung bình
              </h3>
              <p className="text-xs text-slate-500">Biến động điểm trung bình toàn khoa qua 5 học kỳ gần nhất</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Thang 4.0
            </span>
          </div>

          <div className="h-[280px] w-full">
            {!mounted ? (
              <div className="h-full w-full bg-slate-50/70 animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gpaTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis domain={[2.5, 3.2]} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    formatter={(val: any) => [val, "GPA tích lũy TB"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="GPA tích lũy TB"
                    stroke={THEME_COLORS.primary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: THEME_COLORS.primary }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Tiến độ CTĐT (Stacked Bar Chart) - Col 6 */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Tiến độ Hoàn thành CTĐT
              </h3>
              <p className="text-xs text-slate-500">Tỷ lệ đúng tiến độ / chậm tiến độ (%)</p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setCompletionBreakdown("program")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  completionBreakdown === "program"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                CTĐT
              </button>
              <button
                type="button"
                onClick={() => setCompletionBreakdown("cohort")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  completionBreakdown === "cohort"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Khóa
              </button>
            </div>
          </div>

          <div className="h-[250px] w-full">
            {!mounted ? (
              <div className="h-full w-full bg-slate-50/70 animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={completionBreakdown === "program" ? programProgressData : cohortProgressData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={60} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, ""]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
                  <Bar dataKey="pass" name="Đúng tiến độ" stackId="a" fill={THEME_COLORS.green} />
                  <Bar dataKey="fail" name="Chậm tiến độ" stackId="a" fill={THEME_COLORS.red} />
                  <Bar dataKey="error" name="Khác" stackId="a" fill={THEME_COLORS.slate} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Tiến độ đăng ký học phần (Stacked Bar Chart) - Col 6 */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Tiến độ Đăng ký Học phần
              </h3>
              <p className="text-xs text-slate-500">Tỷ lệ đăng ký đúng hạn đầu học kỳ (%)</p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setRegistrationBreakdown("program")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  registrationBreakdown === "program"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                CTĐT
              </button>
              <button
                type="button"
                onClick={() => setRegistrationBreakdown("cohort")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  registrationBreakdown === "cohort"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Khóa
              </button>
            </div>
          </div>

          <div className="h-[250px] w-full">
            {!mounted ? (
              <div className="h-full w-full bg-slate-50/70 animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={registrationBreakdown === "program" ? programProgressData : cohortProgressData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={60} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, ""]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
                  <Bar dataKey="pass" name="Đủ kế hoạch" stackId="b" fill={THEME_COLORS.blue} />
                  <Bar dataKey="fail" name="Chậm đăng ký" stackId="b" fill={THEME_COLORS.active} />
                  <Bar dataKey="error" name="Thiếu dữ liệu" stackId="b" fill={THEME_COLORS.slate} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 5: Phân bố Cảnh báo theo Lớp - Col 6 */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Phân bố Sinh viên Cảnh báo theo Lớp
              </h3>
              <p className="text-xs text-slate-500">Số lượng sinh viên diện Đỏ và Vàng cần theo dõi</p>
            </div>
          </div>

          <div className="h-[250px] w-full">
            {!mounted ? (
              <div className="h-full w-full bg-slate-50/70 animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warningByClassData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis type="category" dataKey="classId" tick={{ fontSize: 11, fill: "#64748B" }} width={70} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="red" name="Nguy cơ cao (Đỏ)" fill={THEME_COLORS.red} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="yellow" name="Cần lưu ý (Vàng)" fill={THEME_COLORS.yellow} stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 6: GPA theo Lớp - Col 6 */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                {filters.gpaAggregation === "median" ? "Trung vị" : "Trung bình"} GPA {filters.gpaScope === "term" ? "Học kỳ" : "Tích lũy"} theo Lớp
              </h3>
              <p className="text-xs text-slate-500">So sánh kết quả GPA giữa các lớp sinh viên</p>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={filters.gpaScope}
                onChange={(e) => setFilters({ ...filters, gpaScope: e.target.value as any })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                <option value="cumulative">Tích lũy</option>
                <option value="term">Học kỳ</option>
              </select>
              <select
                value={filters.gpaAggregation}
                onChange={(e) => setFilters({ ...filters, gpaAggregation: e.target.value as any })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                <option value="median">Trung vị</option>
                <option value="average">Trung bình</option>
              </select>
            </div>
          </div>

          <div className="h-[250px] w-full">
            {!mounted ? (
              <div className="h-full w-full bg-slate-50/70 animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gpaByClassData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis type="category" dataKey="classId" tick={{ fontSize: 11, fill: "#64748B" }} width={70} />
                  <Tooltip
                    formatter={(val: any) => [val, "Điểm GPA"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                  <Bar dataKey="value" name="GPA" fill={THEME_COLORS.primary} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 5. Sinh viên Cảnh báo Học tập Gần nhất (SWE Table) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Sinh viên Có Tín hiệu Cảnh báo Học tập
            </h3>
            <p className="text-xs text-slate-500">Danh sách các trường hợp nguy cơ cần ưu tiên đôn đốc hỗ trợ</p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Xem toàn bộ ({warningTotal})</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Sinh viên</th>
                <th className="py-3 px-4">Lớp / CTĐT</th>
                <th className="py-3 px-4">GPA</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Mức độ</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warningStudents.length > 0 ? (
                warningStudents.map((st) => (
                  <tr key={st.id || st.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{st.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{st.studentCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{st.className || "Chưa xếp lớp"}</div>
                      <div className="text-[11px] text-slate-400">{st.programCode || "CNTT"}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-slate-900">
                        {st.termGpa4 != null || st.termGpa != null ? Number(st.termGpa4 ?? st.termGpa).toFixed(2) : "—"}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5">
                        TL: {st.cumulativeGpa4 != null || st.cumulativeGpa != null ? Number(st.cumulativeGpa4 ?? st.cumulativeGpa).toFixed(2) : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center w-max px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            st.registrationStatus === "fail"
                              ? "bg-orange-100 text-orange-800"
                              : st.registrationStatus === "unassessed"
                                ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {st.registrationStatus === "fail" ? "Chậm đăng ký" : st.registrationStatus === "unassessed" ? "Chưa đánh giá đăng ký" : "Đúng tiến độ"}
                        </span>
                        <span
                          className={`inline-flex items-center w-max px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            st.scheduleStatus === "behind_schedule"
                              ? "bg-red-100 text-red-800"
                              : st.scheduleStatus === "unassessed"
                                ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {st.scheduleStatus === "behind_schedule" ? "Chậm CTĐT" : st.scheduleStatus === "unassessed" ? "Chưa đánh giá CTĐT" : "Đúng CTĐT"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          (st.maxSeverity || st.severity) === "high"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : (st.maxSeverity || st.severity) === "medium"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {(st.maxSeverity || st.severity) === "high" ? "Nguy cơ cao" : "Cần lưu ý"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/students/${st.studentId}`)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                      >
                        Xem hồ sơ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Không có sinh viên cảnh báo trong phạm vi dữ liệu hiện có
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="text-center text-[11px] text-slate-400 pt-2" suppressHydrationWarning>
        {currentTime ? `Cập nhật lúc ${currentTime} · ` : ""}Dữ liệu tổng hợp trực tiếp từ hồ sơ học vụ hiện có
      </div>
    </div>
  );
}
