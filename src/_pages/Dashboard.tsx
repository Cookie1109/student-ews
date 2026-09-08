import { useState } from "react";
import type { Role } from "../stores/authStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from "recharts";
import { students, semesterTrend, topWarningClasses } from "../data/mockData";
import WarningBadge from "../components/WarningBadge";
import type { WarningLevel } from "../data/mockData";

const warningLevels: WarningLevel[] = ["red", "yellow", "green"];

const levelMeta = {
  red: { label: "Đỏ – Khẩn cấp", color: "#DC2626", bg: "bg-red-50", border: "border-red-200", icon: "🔴" },
  yellow: { label: "Vàng – Chú ý", color: "#CA8A04", bg: "bg-yellow-50", border: "border-yellow-200", icon: "🟡" },
  green: { label: "Xanh – Bình thường", color: "#16A34A", bg: "bg-green-50", border: "border-green-200", icon: "🟢" },
};

const prevCounts = { red: 22, yellow: 30, green: 123 };

interface Props {
  onViewStudent?: (id: string) => void;
  role: Role;
}

export default function Dashboard({ onViewStudent, role }: Props) {
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const counts = warningLevels.reduce((acc, l) => {
    acc[l] = students.filter(s => s.warningLevel === l).length;
    return acc;
  }, {} as Record<WarningLevel, number>);

  const priorityStudents = students
    .filter(s => s.warningLevel === "red" || (s.warningLevel === "yellow" && s.interventionStatus === "none"))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const contactRate = Math.round(
    (students.filter(s => s.interventionStatus !== "none").length / students.length) * 100
  );

  const isHigherRole = role === "STUDENT_AFFAIRS_ASSISTANT" || role === "FACULTY_BOARD" || role === "SYSTEM_ADMIN" || role === "COMMS_ASSISTANT";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Học kỳ 1 – 2024/2025 · Cập nhật lần cuối: 15/12/2024 09:32</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary-light)] border border-[var(--color-primary)] rounded-lg text-sm text-[var(--color-primary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary-light)]0 animate-pulse"></span>
          Dữ liệu đã đồng bộ
        </div>
      </div>

      {/* Warning level stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warningLevels.map(level => {
          const m = levelMeta[level];
          const count = counts[level];
          const prev = prevCounts[level];
          const diff = count - prev;
          const pct = Math.abs(Math.round((diff / prev) * 100));
          return (
            <div
              key={level}
              className={`rounded-xl border p-4 cursor-pointer transition-all duration-150 ${m.bg} ${m.border} ${hoveredStat === level ? "shadow-md scale-[1.02]" : "shadow-sm"}`}
              onMouseEnter={() => setHoveredStat(level)}
              onMouseLeave={() => setHoveredStat(null)}
              onClick={() => onViewStudent && onViewStudent("")}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xl">{m.icon}</span>
                {diff !== 0 && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${diff > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                    {diff > 0 ? "▲" : "▼"} {pct}%
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold" style={{ color: m.color, fontFamily: "Outfit, sans-serif" }}>{count}</div>
              <div className="text-sm font-medium text-slate-600 mt-1">{m.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">Kỳ trước: {prev} SV</div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Priority list + Contact rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Priority */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Sinh viên ưu tiên gặp tuần này</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{priorityStudents.length} SV</span>
          </div>
          <div className="divide-y divide-slate-50">
            {priorityStudents.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onViewStudent && onViewStudent(s.id)}
              >
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-mono font-medium">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.id} · {s.className} · GPA: {s.currentGPA.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <WarningBadge level={s.warningLevel} short />
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: s.riskScore >= 70 ? "#DC2626" : s.riskScore >= 45 ? "#CA8A04" : "#16A34A", fontFamily: "JetBrains Mono, monospace" }}>{s.riskScore}</div>
                    <div className="text-xs text-slate-400">điểm rủi ro</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.interventionStatus === "none" ? "bg-red-50 text-red-600" :
                    s.interventionStatus === "contacted" ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" :
                    s.interventionStatus === "monitoring" ? "bg-yellow-50 text-yellow-700" :
                    "bg-green-50 text-green-600"
                  }`}>
                    {s.interventionStatus === "none" ? "Chưa liên hệ" :
                     s.interventionStatus === "contacted" ? "Đã liên hệ" :
                     s.interventionStatus === "monitoring" ? "Đang theo dõi" : "Đã xử lý"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics column */}
        <div className="space-y-4">
          {/* Contact rate */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Tỷ lệ can thiệp</h3>
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#1D4ED8" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - contactRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>{contactRate}%</span>
                <span className="text-xs text-slate-400">đã liên hệ</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Chưa liên hệ</span>
                <span className="font-medium text-red-600">{students.filter(s => s.interventionStatus === "none").length} SV</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đang theo dõi</span>
                <span className="font-medium text-yellow-600">{students.filter(s => s.interventionStatus === "monitoring").length} SV</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đã xử lý</span>
                <span className="font-medium text-green-600">{students.filter(s => s.interventionStatus === "resolved").length} SV</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Chỉ số nhanh</h3>
            <div className="space-y-2">
              {[
                { label: "Tổng SV theo dõi", value: students.length, unit: "SV", color: "text-slate-800" },
                { label: "GPA TB toàn trường", value: (students.reduce((a, s) => a + s.currentGPA, 0) / students.length).toFixed(2), unit: "/4.0", color: "text-[var(--color-primary)]" },
                { label: "Cần gặp ngay", value: counts.red, unit: "SV", color: "text-red-600" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className={`font-bold text-sm ${item.color}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {item.value}<span className="text-xs font-normal text-slate-400"> {item.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts (higher roles only) */}
      {isHigherRole && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trend chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Xu hướng cảnh báo qua các kỳ</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={semesterTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="semester" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  cursor={{ fill: "rgba(241,245,249,0.5)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="red" name="Đỏ" fill="#DC2626" radius={[3, 3, 0, 0]} />
                <Bar dataKey="yellow" name="Vàng" fill="#EAB308" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top classes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Top 5 lớp có tỷ lệ cảnh báo cao nhất</h2>
            <div className="space-y-3">
              {topWarningClasses.map((cls, i) => (
                <div key={cls.className} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-mono text-slate-400 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{cls.className}</span>
                      <span className="text-xs font-mono font-bold text-red-600">{cls.rate}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cls.rate}%`,
                          background: `var(--color-red)`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{cls.warning}/{cls.total} sinh viên · {cls.faculty}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trend line for GPA */}
      {isHigherRole && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Xu hướng GPA trung bình – SV cảnh báo đỏ</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={[
              { kỳ: "HK2/22-23", "Đỏ": 1.75 },
              { kỳ: "HK1/23-24", "Đỏ": 1.70 },
              { kỳ: "HK2/23-24", "Đỏ": 1.65 },
              { kỳ: "HK1/24-25", "Đỏ": 1.62 },
            ]} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="kỳ" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <YAxis domain={[1.4, 2.2]} tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Line type="monotone" dataKey="Đỏ" stroke="#DC2626" strokeWidth={2} dot={{ fill: "#DC2626", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
