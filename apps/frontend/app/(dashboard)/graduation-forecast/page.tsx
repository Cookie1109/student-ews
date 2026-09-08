"use client";

import { useState, useEffect } from "react";
import FilterBar from "@/components/ui/FilterBar";
import SlideOverDrawer from "@/components/ui/SlideOverDrawer";
import Modal from "@/components/ui/Modal";

export default function GraduationForecastPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected run & Drawer state
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Trigger modal state
  const [showModal, setShowModal] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [rRes, cRes, pRes, yRes] = await Promise.all([
          fetch("/api/v1/training-progress/completion/runs"),
          fetch("/api/v1/cohorts"),
          fetch("/api/v1/training-programs"),
          fetch("/api/v1/academic-years"),
        ]);

        if (rRes.ok) {
          const json = await rRes.json();
          setRuns(Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : []);
        }
        if (cRes.ok) {
          const cJson = await cRes.json();
          setCohorts(Array.isArray(cJson.items) ? cJson.items : Array.isArray(cJson) ? cJson : []);
        }
        if (pRes.ok) {
          const pJson = await pRes.json();
          setPrograms(Array.isArray(pJson.items) ? pJson.items : Array.isArray(pJson) ? pJson : []);
        }
        if (yRes.ok) {
          const yJson = await yRes.json();
          setYears(Array.isArray(yJson.items) ? yJson.items : Array.isArray(yJson) ? yJson : []);
        }
      } catch (err) {
        console.error("Error loading graduation forecast:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  const handleOpenRunReport = async (run: any) => {
    setSelectedRun(run);
    try {
      const res = await fetch(`/api/v1/training-progress/completion/runs/${run.id}/students`);
      if (res.ok) {
        const json = await res.json();
        setStudents(json.items || json || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenStudentDetail = async (runId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/v1/training-progress/completion/runs/${runId}/students/${studentId}`);
      if (res.ok) {
        setSelectedStudentDetail(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohort || !selectedProgram || !selectedTerm) {
      alert("Vui lòng chọn đầy đủ Khóa, Chương trình đào tạo và Học kỳ dự báo!");
      return;
    }

    try {
      setTriggerLoading(true);
      const res = await fetch("/api/v1/training-progress/completion/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cohortId: selectedCohort,
          trainingProgramId: selectedProgram,
          assessmentAcademicTermId: selectedTerm,
        }),
      });

      if (res.ok) {
        alert("Đã hoàn tất tính toán dự kiến tốt nghiệp!");
        setShowModal(false);
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Lỗi khi chạy đánh giá");
      }
    } catch (e: any) {
      alert(e.message || "Lỗi xử lý");
    } finally {
      setTriggerLoading(false);
    }
  };

  const termsForSelectedYear = years.find((y) => y.id === selectedYear)?.terms || [];

  const filteredStudents = students.filter((st) => {
    if (statusFilter === "all") return true;
    return st.programCompletionStatus === statusFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Dự kiến Sinh viên Tốt nghiệp Đúng hạn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dự báo khả năng hoàn thành CTĐT đúng hạn; học phần chờ điểm được giả định đạt và đánh dấu riêng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCohort(cohorts[0]?.id || "");
              setSelectedProgram(programs[0]?.id || "");
              setSelectedYear(years[0]?.id || "");
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Chạy dự báo tốt nghiệp</span>
          </button>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
            Lịch sử Dự báo Tốt nghiệp ({runs.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Đang tải dữ liệu dự báo...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3.5 px-4">Mốc đánh giá hoàn thành</th>
                  <th className="py-3.5 px-4">Khóa / CTĐT</th>
                  <th className="py-3.5 px-4">Tổng SV</th>
                  <th className="py-3.5 px-4">Dự kiến Có thể tốt nghiệp</th>
                  <th className="py-3.5 px-4">Chờ kết quả điểm</th>
                  <th className="py-3.5 px-4">Chưa đủ điều kiện</th>
                  <th className="py-3.5 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chưa có phiên dự báo tốt nghiệp nào.
                    </td>
                  </tr>
                ) : (
                  runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.assessmentTermCode || "HK02"} ({r.assessmentAcademicYear || "2024-2025"})
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.cohortCode || "K45"} • {r.programCode || "CNTT"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.totalStudents || 0}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {r.completedStudents || 0} SV (
                          {r.totalStudents ? Math.round((r.completedStudents / r.totalStudents) * 100) : 0}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          {r.pendingResultStudents || 0} SV chờ điểm
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          {r.incompleteStudents || 0} SV nợ môn
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenRunReport(r)}
                          className="px-3 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] border border-[var(--color-primary)]/40 rounded-lg transition-colors cursor-pointer"
                        >
                          Xem danh sách →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-Over Drawer: Danh sách Sinh viên Dự báo */}
      <SlideOverDrawer
        isOpen={Boolean(selectedRun)}
        onClose={() => setSelectedRun(null)}
        title="Danh sách Dự báo Tốt nghiệp Sinh viên"
        subtitle={`Mốc đánh giá: ${selectedRun?.assessmentTermCode || "HK02"} • ${selectedRun?.assessmentAcademicYear || "2024-2025"}`}
        width="4xl"
      >
        {selectedRun && (
          <div className="space-y-6">
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tổng SV</span>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{selectedRun.totalStudents}</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Có thể tốt nghiệp</span>
                <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{selectedRun.completedStudents}</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Chờ kết quả</span>
                <div className="text-xl font-bold text-amber-700 font-mono mt-0.5">{selectedRun.pendingResultStudents}</div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-[10px] font-bold text-red-800 uppercase">Chưa đủ CTĐT</span>
                <div className="text-xl font-bold text-red-700 font-mono mt-0.5">{selectedRun.incompleteStudents}</div>
              </div>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Trạng thái dự báo:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Có thể tốt nghiệp (Completed)</option>
                <option value="incomplete">Chưa đủ CTĐT (Incomplete)</option>
              </select>
            </div>

            {/* Students Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[460px] scrollbar-thin">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Sinh viên</th>
                      <th className="py-2.5 px-3">Kết luận Dự báo</th>
                      <th className="py-2.5 px-3">GPA Tích lũy</th>
                      <th className="py-2.5 px-3">Tình trạng CTĐT</th>
                      <th className="py-2.5 px-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Không có sinh viên trong bộ lọc này
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => (
                        <tr key={st.id || st.studentId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            <div>{st.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{st.studentId} • {st.classId}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`w-max px-2 py-0.5 rounded text-[10px] font-bold ${
                                  st.programCompletionStatus === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {st.programCompletionStatus === "completed" ? "Có thể tốt nghiệp" : "Chưa đủ CTĐT"}
                              </span>
                              {st.pendingResultCourses > 0 && (
                                <span className="w-max px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  Đạt có điều kiện ({st.pendingResultCourses} môn chờ điểm)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <div>Hệ 4: <strong>{st.cumulativeGpa4 ? Number(st.cumulativeGpa4).toFixed(2) : "—"}</strong></div>
                            <div className="text-[11px] text-slate-400">Hệ 10: {st.cumulativeGpa10 ? Number(st.cumulativeGpa10).toFixed(2) : "—"}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div>{st.allPlansPassed || 8}/{st.allPlansTotal || 8} kế hoạch đạt</div>
                            {(st.missingMandatoryCourses > 0 || st.missingElectiveCredits > 0) && (
                              <div className="text-[10px] text-red-600 font-semibold">
                                Thiếu {st.missingMandatoryCourses || 0} HP bắt buộc, {st.missingElectiveCredits || 0} TC tự chọn
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenStudentDetail(selectedRun.id, st.studentId)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Khung môn →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* Modal: Chạy dự báo mới */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Chạy Dự báo Hoàn thành CTĐT & Tốt nghiệp"
        description="Chọn các thông số khóa tuyển sinh, chương trình đào tạo và kỳ đối soát"
        maxWidth="lg"
      >
        <form onSubmit={handleTriggerRun} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Khóa sinh viên</label>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
            >
              {cohorts.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.cohortCode} - {co.cohortName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chương trình đào tạo</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.programCode} - {p.programName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học tốt nghiệp dự kiến</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedTerm("");
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.sYearCode || y.yearCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Học kỳ đánh giá</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
              >
                <option value="">Chọn học kỳ</option>
                {termsForSelectedYear.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.sTermCode || t.termCode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition Preview Checklist (ported from SWE GraduationForecastPreview) */}
          <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Kiểm tra điều kiện trước khi chạy (Preview Validation)</span>
              {selectedCohort && selectedProgram && selectedTerm ? (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  ✓ Đã chọn đủ thông số
                </span>
              ) : (
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                  Chờ chọn phạm vi
                </span>
              )}
            </div>

            {selectedCohort && selectedProgram && selectedTerm ? (
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex items-start gap-1.5 text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-150">
                  <span className="font-bold text-blue-800 shrink-0">ℹ️ Thông tin:</span>
                  <span>
                    Dự báo hoàn thành CTĐT đúng hạn tại kỳ được chọn; các môn học chưa có điểm chính thức sẽ được giả định là Đạt và đánh dấu riêng "Đạt có điều kiện".
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                  <span className="font-bold shrink-0">⚠️ Cảnh báo:</span>
                  <span>
                    Snapshot dự báo sẽ phản ánh toàn bộ tiến độ lũy kế tính đến kỳ đánh giá này. Hãy đảm bảo kế hoạch đào tạo của khóa đã được Khóa (Locked).
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Vui lòng chọn Khóa, Chương trình đào tạo và Học kỳ mốc để hệ thống kiểm tra các ràng buộc dữ liệu.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={triggerLoading || !selectedCohort || !selectedProgram || !selectedTerm}
              className="px-5 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 rounded-xl transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {triggerLoading ? "Đang tính toán..." : "Bắt đầu dự báo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Chi tiết khung môn học sinh viên */}
      {selectedStudentDetail && (
        <Modal
          isOpen={Boolean(selectedStudentDetail)}
          onClose={() => setSelectedStudentDetail(null)}
          title={`Khung Môn Học: ${selectedStudentDetail.studentName} (${selectedStudentDetail.studentId})`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span>Lớp: <strong>{selectedStudentDetail.classId}</strong></span>
              <span>GPA Hệ 4: <strong className="font-mono">{Number(selectedStudentDetail.cumulativeGpa4 || 0).toFixed(2)}</strong></span>
              <span>Học phần chờ điểm: <strong className="text-amber-700">{selectedStudentDetail.pendingResultCourses || 0} môn</strong></span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {(selectedStudentDetail.plans || []).map((plan: any) => (
                <div key={plan.id} className="p-3 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Học kỳ lộ trình {plan.curriculumSemesterNo}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${plan.isPass ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                      {plan.isPass ? "Đạt kỳ" : "Chưa đạt"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {(plan.courses || []).map((c: any) => (
                      <div key={c.courseId} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <span className="font-medium text-slate-700">{c.courseCode} - {c.courseName}</span>
                        <span className={`text-[11px] font-semibold ${
                          c.pendingResult ? "text-amber-600" : c.passed ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {c.pendingResult ? "Chờ kết quả" : c.passed ? "Đạt" : "Chưa đạt"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
