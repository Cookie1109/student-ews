import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { students, semesterTrend } from "../data/mockData";

const COLORS = ["#DC2626", "#EAB308", "#22C55E"];

export default function Reports() {
  const levelCounts = [
    { name: "Đỏ – Khẩn cấp", value: students.filter(s => s.warningLevel === "red").length, color: "#DC2626" },
    { name: "Vàng – Chú ý", value: students.filter(s => s.warningLevel === "yellow").length, color: "#EAB308" },
    { name: "Xanh – Bình thường", value: students.filter(s => s.warningLevel === "green").length, color: "#22C55E" },
  ];

  const facultyStats = [
    { faculty: "CNTT", red: 5, yellow: 5, resolved: 8 },
    { faculty: "QTKD", red: 3, yellow: 3, resolved: 5 },
    { faculty: "Kế toán", red: 0, yellow: 2, resolved: 4 },
    { faculty: "Luật", red: 0, yellow: 2, resolved: 3 },
  ];

  const interventionStats = [
    { name: "Đã giải quyết", before: 82, after: 95, change: +16 },
    { name: "Cải thiện GPA ≥ 0.3", before: 25, after: 48, change: +92 },
    { name: "Điểm rèn luyện tăng", before: 40, after: 62, change: +55 },
    { name: "Hoàn thành kế hoạch", before: 60, after: 78, change: +30 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>Báo cáo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tổng hợp số liệu học kỳ 1 – 2024/2025</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-white transition-colors bg-white shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Xuất Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Report selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { title: "Báo cáo tổng hợp cuối kỳ", desc: "Thống kê sinh viên theo mức cảnh báo, khoa, ngành", icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>) },
          { title: "Báo cáo danh sách CVHT", desc: "Danh sách sinh viên cần gặp theo từng cố vấn", icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>) },
          { title: "Báo cáo hiệu quả can thiệp", desc: "So sánh tình trạng trước và sau hỗ trợ", icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>) },
        ].map(report => (
          <div key={report.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-[var(--color-primary)] hover:shadow-md cursor-pointer transition-all group">
            <div className="text-slate-400 group-hover:text-[var(--color-primary)] transition-colors mb-2">{report.icon}</div>
            <h3 className="font-semibold text-slate-800 text-sm group-hover:text-[var(--color-primary)] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>{report.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{report.desc}</p>
            <div className="mt-3 text-xs text-[var(--color-primary)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Tạo báo cáo →</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Phân bố mức cảnh báo – HK1 2024/25</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={levelCounts} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {levelCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Xu hướng số SV cảnh báo qua các kỳ</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={semesterTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="semester" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} cursor={{ fill: "rgba(241,245,249,0.5)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="red" name="Đỏ" fill="#DC2626" radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="yellow" name="Vàng" fill="#EAB308" radius={[3, 3, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Faculty breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Thống kê theo khoa</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Khoa</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-red-500 uppercase tracking-wide">Đỏ</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wide">Vàng</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-green-600 uppercase tracking-wide">Đã xử lý</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {facultyStats.map((row, i) => (
                <tr key={row.faculty} className={`border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">{row.faculty}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-red-600">{row.red}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-yellow-600">{row.yellow}</td>
                  <td className="px-4 py-3 text-center font-mono text-green-600">{row.resolved}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-slate-800">{row.red + row.yellow}</span>
                    <span className="text-slate-400 text-xs ml-1">SV</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intervention effectiveness */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Hiệu quả can thiệp – So sánh trước/sau hỗ trợ</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {interventionStats.map(stat => (
            <div key={stat.name} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm text-slate-500 mb-3 font-medium">{stat.name}</div>
              <div className="flex items-end gap-3 mb-2">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Trước</div>
                  <div className="text-xl font-bold text-slate-400" style={{ fontFamily: "Outfit, sans-serif" }}>{stat.before}%</div>
                </div>
                <div className="text-slate-300 text-lg mb-0.5">→</div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Sau</div>
                  <div className="text-xl font-bold text-green-600" style={{ fontFamily: "Outfit, sans-serif" }}>{stat.after}%</div>
                </div>
              </div>
              <div className="text-xs text-green-600 font-semibold">▲ +{stat.change}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
