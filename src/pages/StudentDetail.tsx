import { useState, type ReactNode } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { students } from "../data/mockData";
import WarningBadge from "../components/WarningBadge";
import type { InterventionLog } from "../data/mockData";

import { useParams, useNavigate } from "react-router-dom";

const academicStatusLabel: Record<string, { label: string; color: string }> = {
  normal: { label: "Bình thường", color: "text-green-600 bg-green-50 border-green-200" },
  warning1: { label: "Cảnh báo học vụ lần 1", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  warning2: { label: "Cảnh báo học vụ lần 2", color: "text-red-600 bg-red-50 border-red-200" },
  suspended: { label: "Đình chỉ học tập", color: "text-red-800 bg-red-100 border-red-300" },
};

const methodLabel: Record<string, string> = {
  direct: "Gặp trực tiếp",
  phone: "Điện thoại",
  email: "Email",
};

const methodIcon: Record<string, ReactNode> = {
  direct: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>),
  phone: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" /></svg>),
  email: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>),
};

export default function StudentDetail() {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate(-1);

  const student = students.find(s => s.id === studentId);
  const [tab, setTab] = useState<"overview" | "grades" | "interventions">("overview");
  const [showLogForm, setShowLogForm] = useState(false);
  const [newLog, setNewLog] = useState<Partial<InterventionLog>>({
    method: "direct",
    date: new Date().toISOString().split("T")[0],
  });
  const [logs, setLogs] = useState<InterventionLog[]>(student?.interventions ?? []);

  if (!student) return (
    <div className="p-6">
      <button onClick={onBack} className="text-[var(--color-primary)] hover:opacity-80 text-sm mb-4">← Quay lại</button>
      <p className="text-slate-500">Không tìm thấy sinh viên.</p>
    </div>
  );

  const acStatus = academicStatusLabel[student.academicStatus];

  const handleSaveLog = () => {
    if (!newLog.content || !newLog.date) return;
    const log: InterventionLog = {
      id: `i${Date.now()}`,
      date: newLog.date!,
      method: newLog.method as "direct" | "phone" | "email",
      content: newLog.content ?? "",
      result: newLog.result ?? "",
      nextPlan: newLog.nextPlan ?? "",
      nextDate: newLog.nextDate ?? "",
      advisor: "ThS. Nguyễn Thị Hoa",
    };
    setLogs(prev => [log, ...prev]);
    setNewLog({ method: "direct", date: new Date().toISOString().split("T")[0] });
    setShowLogForm(false);
    setTab("interventions");
  };

  return (
    <div className="p-6 space-y-5">
      {/* Back + header */}
      <div>
        <button onClick={onBack} className="text-[var(--color-primary)] hover:opacity-80 text-sm font-medium mb-4 flex items-center gap-1">
          ← Quay lại danh sách
        </button>
        <div className="flex flex-wrap items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0" style={{ fontFamily: "Outfit, sans-serif" }}>
            {student.name.split(" ").pop()?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>{student.name}</h1>
              <WarningBadge level={student.warningLevel} />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${acStatus.color}`}>{acStatus.label}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>{student.id}</span>
              <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>{student.className} · {student.faculty}</span>
              <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>{student.major} · Khóa {student.enrollYear}</span>
              <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>CVHT: {student.advisor}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
              <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" /></svg>{student.phone}</span>
              <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>{student.email}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: student.riskScore >= 75 ? "#DC2626" : student.riskScore >= 55 ? "#EA580C" : "#CA8A04" }}>
                {student.riskScore}
              </div>
              <div className="text-xs text-slate-400">Điểm rủi ro</div>
            </div>
            <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                {student.currentGPA.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400">GPA hiện tại</div>
            </div>
            <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                {student.trainingScore}
              </div>
              <div className="text-xs text-slate-400">Điểm rèn luyện</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200">
        {(["overview", "grades", "interventions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {t === "overview" ? "Tổng quan" : t === "grades" ? "Bảng điểm" : `Nhật ký can thiệp (${logs.length})`}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* GPA chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Xu hướng GPA qua các kỳ</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={student.gpaHistory} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="semester" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                <ReferenceLine y={2.0} stroke="#EA580C" strokeDasharray="4 2" strokeWidth={1} label={{ value: "2.0", position: "right", fontSize: 10, fill: "#EA580C" }} />
                <ReferenceLine y={1.6} stroke="#DC2626" strokeDasharray="4 2" strokeWidth={1} label={{ value: "1.6", position: "right", fontSize: 10, fill: "#DC2626" }} />
                <Line
                  type="monotone" dataKey="gpa" stroke="#1D4ED8" strokeWidth={2.5}
                  dot={{ fill: "#1D4ED8", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Training score chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Xu hướng điểm rèn luyện</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={student.trainingHistory} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="semester" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                <ReferenceLine y={50} stroke="#EA580C" strokeDasharray="4 2" strokeWidth={1} />
                <ReferenceLine y={40} stroke="#DC2626" strokeDasharray="4 2" strokeWidth={1} />
                <Line
                  type="monotone" dataKey="score" stroke="#9333EA" strokeWidth={2.5}
                  dot={{ fill: "#9333EA", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Phân tích điểm rủi ro</h3>
            <div className="space-y-4">
              {[
                { label: "Học tập (60%)", value: Math.round((1 - student.currentGPA / 4) * 100), color: "#1D4ED8", note: `GPA ${student.currentGPA.toFixed(2)}/4.0` },
                { label: "Rèn luyện (25%)", value: Math.round((1 - student.trainingScore / 100) * 100), color: "#9333EA", note: `${student.trainingScore}/100 điểm` },
                { label: "Hoạt động (15%)", value: Math.round((1 - student.activityScore / 100) * 100), color: "#0891B2", note: `${student.activityScore}/100 điểm` },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-xs text-slate-400">{item.note}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Tổng điểm rủi ro</span>
                  <span className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: student.riskScore >= 75 ? "#DC2626" : "#EA580C" }}>
                    {student.riskScore}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent interventions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Can thiệp gần nhất</h3>
              <button onClick={() => { setShowLogForm(true); setTab("interventions"); }} className="text-xs text-[var(--color-primary)] hover:opacity-80 font-medium">+ Thêm nhật ký</button>
            </div>
            {logs.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">Chưa có nhật ký theo dõi</div>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 2).map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span>{methodIcon[log.method]}</span>
                      <span className="text-xs font-medium text-slate-600">{methodLabel[log.method]}</span>
                      <span className="text-xs text-slate-400 ml-auto">{log.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{log.content}</p>
                  </div>
                ))}
                {logs.length > 2 && (
                  <button onClick={() => setTab("interventions")} className="text-xs text-[var(--color-primary)] hover:underline">Xem tất cả {logs.length} nhật ký →</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grades tab */}
      {tab === "grades" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Bảng điểm – HK1 2024/2025</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Môn học</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Số TC</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Điểm (10)</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Xếp loại</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {student.grades.map((g, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium text-slate-800">{g.subject}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{g.credits}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold" style={{
                    color: g.score < 4 ? "#DC2626" : g.score < 5 ? "#EA580C" : g.score < 7 ? "#CA8A04" : "#16A34A"
                  }}>
                    {g.score.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded font-mono text-xs font-bold ${g.letterGrade === "F" ? "bg-red-100 text-red-700" :
                        g.letterGrade.startsWith("D") ? "bg-orange-100 text-orange-700" :
                          g.letterGrade.startsWith("C") ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                      }`}>
                      {g.letterGrade}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {g.score < 4 ? "Không đạt" : g.score < 5.5 ? "Trung bình yếu" : g.score < 7 ? "Trung bình" : g.score < 8.5 ? "Khá" : "Giỏi"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={2} className="px-5 py-3 text-sm font-semibold text-slate-700">Tổng kết</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                  {(student.currentGPA * 2.5).toFixed(1)}
                </td>
                <td colSpan={2} className="px-5 py-3 text-sm text-slate-500">
                  GPA: <strong style={{ fontFamily: "JetBrains Mono, monospace" }}>{student.currentGPA.toFixed(2)}</strong> · {student.grades.filter(g => g.score < 4).length} môn không đạt
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Interventions tab */}
      {tab === "interventions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Lịch sử nhật ký can thiệp</h3>
            <button
              onClick={() => setShowLogForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {showLogForm ? "✕ Hủy" : "+ Thêm nhật ký"}
            </button>
          </div>

          {/* Log form */}
          {showLogForm && (
            <div className="bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
              <h4 className="font-semibold text-[var(--color-primary)]" style={{ fontFamily: "Outfit, sans-serif" }}>Ghi nhật ký theo dõi mới</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-primary)] block mb-1">Ngày gặp</label>
                  <input type="date" value={newLog.date} onChange={e => setNewLog(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-primary)] block mb-1">Hình thức</label>
                  <select value={newLog.method} onChange={e => setNewLog(p => ({ ...p, method: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                    <option value="direct">🤝 Gặp trực tiếp</option>
                    <option value="phone">📞 Điện thoại</option>
                    <option value="email">📧 Email</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-primary)] block mb-1">Ngày gặp tiếp theo</label>
                  <input type="date" value={newLog.nextDate || ""} onChange={e => setNewLog(p => ({ ...p, nextDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-primary)] block mb-1">Nội dung buổi gặp</label>
                <textarea rows={3} value={newLog.content || ""} onChange={e => setNewLog(p => ({ ...p, content: e.target.value }))}
                  placeholder="Mô tả nội dung trao đổi, vấn đề sinh viên đang gặp phải..."
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-primary)] block mb-1">Kết quả</label>
                  <textarea rows={2} value={newLog.result || ""} onChange={e => setNewLog(p => ({ ...p, result: e.target.value }))}
                    placeholder="Kết quả đạt được sau buổi gặp..."
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-primary)] block mb-1">Kế hoạch tiếp theo</label>
                  <textarea rows={2} value={newLog.nextPlan || ""} onChange={e => setNewLog(p => ({ ...p, nextPlan: e.target.value }))}
                    placeholder="Dự định theo dõi, hành động tiếp theo..."
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowLogForm(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">Hủy</button>
                <button onClick={handleSaveLog} className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Lưu nhật ký
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          {logs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="mb-3 text-slate-300 flex justify-center"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>
              <p className="text-slate-500">Chưa có nhật ký theo dõi nào</p>
              <button onClick={() => setShowLogForm(true)} className="mt-3 text-sm text-[var(--color-primary)] hover:opacity-80 font-medium">+ Thêm nhật ký đầu tiên</button>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>
              <div className="space-y-4">
                {logs.map((log, i) => (
                  <div key={log.id} className="relative flex gap-4">
                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xl shadow-sm">
                      {methodIcon[log.method]}
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{methodLabel[log.method]}</span>
                          <span className="text-xs text-slate-400">· {log.advisor}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{log.date}</span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{log.content}</p>
                      {log.result && (
                        <div className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-100 mb-2">
                          <strong>Kết quả:</strong> {log.result}
                        </div>
                      )}
                      {log.nextPlan && (
                        <div className="text-xs bg-[var(--color-surface2)] text-[var(--color-primary)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
                          <strong>Kế hoạch tiếp:</strong> {log.nextPlan} {log.nextDate && `· Ngày ${log.nextDate}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
