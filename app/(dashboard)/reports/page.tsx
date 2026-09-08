"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import SlideOverDrawer from "@/components/ui/SlideOverDrawer";

type Severity = "high" | "medium";

type WarningStudent = {
  studentId: string;
  studentCode: string;
  studentName: string;
  classCode: string;
  programCode: string;
  termGpa4: number | null;
  cumulativeGpa4: number | null;
  severity: Severity;
  reasonCodes: string[];
  reasonCount: number;
  academicWarningDecisions: number;
  resolvedActions: number;
  academicYear: string | null;
  termCode: string | null;
};

type ClassWarningBreakdown = {
  classCode: string;
  className: string;
  totalStudents: number;
  high: number;
  medium: number;
  warningStudents: number;
  warningRate: number;
};

type WarningReport = {
  items: WarningStudent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: { students: number; evaluated: number; unassessed: number; high: number; medium: number; safe: number };
  policy: { name: string; termGpaThreshold: number; cumulativeGpaThreshold: number; configured: boolean };
  latestPeriod: { label: string; academicYear: string; termCode: string } | null;
  trend: Array<{ label: string; high: number; medium: number; evaluated: number }>;
  classBreakdown: ClassWarningBreakdown[];
};

type DrawerFilter = { label: string; severity?: Severity; classCode?: string };

const reasonLabel = (code: string) => {
  if (code === "LOW_CUMULATIVE_GPA") return "GPA tích lũy dưới ngưỡng";
  if (code === "LOW_TERM_GPA") return "GPA học kỳ dưới ngưỡng";
  if (code === "ACADEMIC_WARNING_DECISION") return "Có quyết định cảnh báo";
  return code;
};

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WarningReport | null>(null);
  const [loadError, setLoadError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter | null>(null);
  const [drawerData, setDrawerData] = useState<WarningReport | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState("");
  const [drawerPage, setDrawerPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setLoadError("");
        const response = await fetch("/api/v1/reports/academic-warnings?pageSize=20");
        if (!response.ok) throw new Error("Không thể tải dữ liệu cảnh báo học vụ");
        setReport(await response.json());
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Không thể tải báo cáo");
      } finally {
        setLoading(false);
      }
    }
    void loadReport();
  }, []);

  const loadDrawer = useCallback(async (filter: DrawerFilter, page: number, query: string) => {
    try {
      setDrawerLoading(true);
      setDrawerError("");
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (filter.severity) params.set("severity", filter.severity);
      if (filter.classCode) params.set("classCode", filter.classCode);
      if (query.trim()) params.set("search", query.trim());
      const response = await fetch(`/api/v1/reports/academic-warnings?${params.toString()}`);
      if (!response.ok) throw new Error("Không thể tải danh sách sinh viên");
      setDrawerData(await response.json());
    } catch (error) {
      setDrawerData(null);
      setDrawerError(error instanceof Error ? error.message : "Không thể tải danh sách sinh viên");
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!drawerFilter) return;
    const timeout = window.setTimeout(() => void loadDrawer(drawerFilter, drawerPage, search), 200);
    return () => window.clearTimeout(timeout);
  }, [drawerFilter, drawerPage, loadDrawer, search]);

  const openStudents = (filter: DrawerFilter) => {
    setDrawerFilter(filter);
    setDrawerData(null);
    setDrawerError("");
    setDrawerPage(1);
    setSearch("");
  };

  const fetchAllWarningStudents = async () => {
    const firstResponse = await fetch("/api/v1/reports/academic-warnings?page=1&pageSize=100");
    if (!firstResponse.ok) throw new Error("Không thể tải danh sách để xuất báo cáo");
    const first: WarningReport = await firstResponse.json();
    if (first.totalPages <= 1) return first.items;
    const remaining = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, index) =>
        fetch(`/api/v1/reports/academic-warnings?page=${index + 2}&pageSize=100`).then(async (response) => {
          if (!response.ok) throw new Error("Không thể tải đủ dữ liệu để xuất báo cáo");
          return response.json() as Promise<WarningReport>;
        }),
      ),
    );
    return [first, ...remaining].flatMap((result) => result.items);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      setExportError("");
      const students = await fetchAllWarningStudents();
      const headers = ["Mã SV", "Họ và tên", "Lớp", "Chương trình", "Mức cảnh báo", "GPA học kỳ", "GPA tích lũy", "Nguyên nhân"];
      const rows = students.map((student) => [
        student.studentCode, student.studentName, student.classCode, student.programCode,
        student.severity === "high" ? "Nguy cơ cao" : "Cần lưu ý",
        student.termGpa4 ?? "", student.cumulativeGpa4 ?? "",
        student.reasonCodes.map(reasonLabel).join("; "),
      ]);
      const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bao_cao_canh_bao_hoc_vu_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Không thể xuất báo cáo");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5" aria-label="Đang tải báo cáo">
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
        <div className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!report || loadError) {
    return <div className="p-6 max-w-7xl mx-auto"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">{loadError || "Chưa có dữ liệu báo cáo."}</div></div>;
  }

  const { counts } = report;
  const evaluatedRate = counts.students ? (counts.evaluated / counts.students) * 100 : 0;
  const levelCounts = [
    { name: "Đỏ – Nguy cơ cao", value: counts.high, color: "#DC2626", severity: "high" as const },
    { name: "Vàng – Cần lưu ý", value: counts.medium, color: "#EAB308", severity: "medium" as const },
    { name: "Xanh – An toàn", value: counts.safe, color: "#22C55E", severity: null },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
            <span className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">Dữ liệu đến {report.latestPeriod?.label || "kỳ gần nhất"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Báo cáo tổng hợp học vụ & cảnh báo sớm</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Bấm vào mức cảnh báo hoặc lớp để xem danh sách sinh viên tương ứng.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={exporting} onClick={handleExportExcel} className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition bg-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{exporting ? "Đang xuất..." : "Xuất Excel (CSV)"}</button>
          <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">In báo cáo / PDF</button>
        </div>
      </header>

      {exportError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{exportError}</div>}
      {!report.policy.configured && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs text-blue-900">
          Chưa có chính sách cảnh báo được kích hoạt. Báo cáo đang dùng ngưỡng mặc định: GPA học kỳ dưới {report.policy.termGpaThreshold.toFixed(1)} là Cần lưu ý; GPA tích lũy dưới {report.policy.cumulativeGpaThreshold.toFixed(1)} là Nguy cơ cao.
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Chỉ số cảnh báo">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng sinh viên</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{counts.students}</span>
          <span className="text-[11px] text-slate-500">{counts.unassessed} chưa đủ dữ liệu đánh giá</span>
        </div>
        <button type="button" onClick={() => openStudents({ label: "Nguy cơ cao", severity: "high" })} className="text-left p-4 border border-red-200 bg-red-50/40 rounded-2xl shadow-xs hover:border-red-400 hover:-translate-y-0.5 active:translate-y-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
          <span className="text-[10px] uppercase font-bold text-red-700 block">Nguy cơ cao (Mức Đỏ)</span>
          <span className="text-2xl font-bold font-mono text-red-600 mt-1 block">{counts.high}</span>
          <span className="text-[11px] text-red-700">Xem danh sách sinh viên →</span>
        </button>
        <button type="button" onClick={() => openStudents({ label: "Cần lưu ý", severity: "medium" })} className="text-left p-4 border border-amber-200 bg-amber-50/40 rounded-2xl shadow-xs hover:border-amber-400 hover:-translate-y-0.5 active:translate-y-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Cần lưu ý (Mức Vàng)</span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">{counts.medium}</span>
          <span className="text-[11px] text-amber-700">Xem danh sách sinh viên →</span>
        </button>
        <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Phạm vi đã đánh giá</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">{evaluatedRate.toFixed(1)}%</span>
          <span className="text-[11px] text-emerald-700">{counts.evaluated}/{counts.students} sinh viên</span>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Phân bố mức cảnh báo</h2><p className="text-xs text-slate-400">Bấm lát Đỏ hoặc Vàng để xem sinh viên</p></div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{counts.evaluated} SV</span>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={levelCounts} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
              {levelCounts.map((entry) => <Cell key={entry.name} fill={entry.color} cursor={entry.severity ? "pointer" : "default"} onClick={() => entry.severity && openStudents({ label: entry.name, severity: entry.severity })} />)}
            </Pie><Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 12 }} /></PieChart></ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4"><div><h2 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Xu hướng cảnh báo theo học kỳ</h2><p className="text-xs text-slate-400">Tính từ dữ liệu GPA thực tế của từng kỳ</p></div><span className="text-xs font-semibold text-slate-500">Đơn vị: Sinh viên</span></div>
          <div className="h-[230px] w-full">
            {report.trend.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={report.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="high" name="Nguy cơ cao (Đỏ)" fill="#EF4444" radius={[4, 4, 0, 0]} /><Bar dataKey="medium" name="Cần lưu ý (Vàng)" fill="#F59E0B" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="h-full grid place-items-center text-xs text-slate-400">Chưa có dữ liệu GPA theo kỳ.</div>}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between"><div><h2 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Cảnh báo theo lớp sinh viên</h2><p className="text-xs text-slate-400">Bấm tên lớp hoặc số lượng Đỏ/Vàng để mở danh sách tương ứng</p></div><span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">{report.classBreakdown.length} lớp</span></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs">
          <thead><tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px]"><th className="px-4 py-3.5">Lớp học</th><th className="px-4 py-3.5 text-center">Sĩ số</th><th className="px-4 py-3.5 text-center">Nguy cơ cao</th><th className="px-4 py-3.5 text-center">Cần lưu ý</th><th className="px-4 py-3.5 text-center">Tổng cảnh báo</th><th className="px-4 py-3.5 text-right">Tỷ lệ cảnh báo</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{report.classBreakdown.map((row) => <tr key={row.classCode} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3"><button type="button" onClick={() => openStudents({ label: `Lớp ${row.classCode}`, classCode: row.classCode })} className="text-left font-semibold text-slate-800 hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:underline"><span className="block">{row.classCode}</span><span className="text-[10px] text-slate-400 font-normal">{row.className}</span></button></td>
            <td className="px-4 py-3 text-center font-mono text-slate-700">{row.totalStudents}</td>
            <td className="px-4 py-3 text-center"><button type="button" disabled={!row.high} onClick={() => openStudents({ label: `Nguy cơ cao · ${row.classCode}`, classCode: row.classCode, severity: "high" })} className="min-w-8 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 font-mono font-bold text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">{row.high}</button></td>
            <td className="px-4 py-3 text-center"><button type="button" disabled={!row.medium} onClick={() => openStudents({ label: `Cần lưu ý · ${row.classCode}`, classCode: row.classCode, severity: "medium" })} className="min-w-8 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 font-mono font-bold text-amber-600 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">{row.medium}</button></td>
            <td className="px-4 py-3 text-center"><button type="button" disabled={!row.warningStudents} onClick={() => openStudents({ label: `Tất cả cảnh báo · ${row.classCode}`, classCode: row.classCode })} className="font-mono font-bold text-slate-900 hover:text-[var(--color-primary)] disabled:text-slate-400">{row.warningStudents} SV</button></td>
            <td className="px-4 py-3 text-right"><span className="font-mono font-bold text-slate-700">{row.warningRate}%</span></td>
          </tr>)}</tbody>
        </table></div>
      </section>

      <SlideOverDrawer isOpen={Boolean(drawerFilter)} onClose={() => setDrawerFilter(null)} title={drawerFilter?.label || "Sinh viên cảnh báo"} subtitle={drawerData ? `${drawerData.total} sinh viên phù hợp` : "Đang lọc dữ liệu cảnh báo"} width="4xl">
        <div className="sticky top-0 z-10 bg-white pb-3"><label className="block text-[11px] font-semibold text-slate-500 mb-1.5" htmlFor="warning-student-search">Tìm sinh viên</label><input id="warning-student-search" value={search} onChange={(event) => { setSearch(event.target.value); setDrawerPage(1); }} placeholder="Nhập MSSV hoặc họ tên..." className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" /></div>
        {drawerLoading ? <div className="space-y-3">{[0, 1, 2, 3].map((item) => <div key={item} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div> : drawerError ? <div className="rounded-xl border border-red-200 bg-red-50 py-10 px-4 text-center text-sm text-red-700">{drawerError}</div> : !drawerData?.items.length ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center text-sm text-slate-500">Không có sinh viên phù hợp với bộ lọc này.</div> : <div className="space-y-3">{drawerData.items.map((student) => <article key={student.studentId} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-slate-900">{student.studentName}</h3><span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${student.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{student.severity === "high" ? "Nguy cơ cao" : "Cần lưu ý"}</span></div><p className="mt-1 text-xs text-slate-500 font-mono">{student.studentCode} · {student.classCode} · {student.programCode}</p><div className="mt-2 flex flex-wrap gap-1.5">{student.reasonCodes.map((reason) => <span key={reason} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{reasonLabel(reason)}</span>)}</div></div><div className="flex items-center gap-4 sm:text-right"><div><span className="block text-[10px] text-slate-400">GPA kỳ</span><strong className="font-mono text-sm text-slate-800">{student.termGpa4?.toFixed(2) ?? "—"}</strong></div><div><span className="block text-[10px] text-slate-400">GPA tích lũy</span><strong className="font-mono text-sm text-slate-800">{student.cumulativeGpa4?.toFixed(2) ?? "—"}</strong></div><button type="button" onClick={() => router.push(`/students/${student.studentId}`)} className="rounded-lg border border-[var(--color-primary)]/50 px-3 py-2 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">Hồ sơ →</button></div></div></article>)}</div>}
        {drawerData && drawerData.totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">Trang {drawerData.page}/{drawerData.totalPages}</span><div className="flex gap-2"><button type="button" disabled={drawerPage <= 1} onClick={() => setDrawerPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Trang trước</button><button type="button" disabled={drawerPage >= drawerData.totalPages} onClick={() => setDrawerPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Trang sau</button></div></div>}
      </SlideOverDrawer>
    </div>
  );
}
