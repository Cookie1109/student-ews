import { useState, useMemo } from "react";
import type { Role } from "../stores/authStore";
import { students } from "../data/mockData";
import WarningBadge from "../components/WarningBadge";
import type { WarningLevel, InterventionStatus } from "../data/mockData";

interface Props {
  onViewStudent: (id: string) => void;
  role: Role;
}

const interventionLabels: Record<InterventionStatus, string> = {
  none: "Chưa liên hệ",
  contacted: "Đã liên hệ",
  monitoring: "Đang theo dõi",
  resolved: "Đã xử lý",
};

const interventionColors: Record<InterventionStatus, string> = {
  none: "bg-red-50 text-red-600",
  contacted: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  monitoring: "bg-yellow-50 text-yellow-700",
  resolved: "bg-green-50 text-green-600",
};

type SortKey = "riskScore" | "currentGPA" | "trainingScore" | "name";

export default function StudentList({ onViewStudent, role }: Props) {
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<WarningLevel | "all">("all");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [filterIntervention, setFilterIntervention] = useState<InterventionStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [exportMenu, setExportMenu] = useState(false);

  const faculties = [...new Set(students.map(s => s.faculty))];

  const filtered = useMemo(() => {
    let list = students.filter(s => {
      const q = search.toLowerCase();
      if (q && !s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      if (filterLevel !== "all" && s.warningLevel !== filterLevel) return false;
      if (filterFaculty !== "all" && s.faculty !== filterFaculty) return false;
      if (filterIntervention !== "all" && s.interventionStatus !== filterIntervention) return false;
      return true;
    });
    list.sort((a, b) => {
      const av = sortKey === "name" ? a.name.localeCompare(b.name) : (a[sortKey] as number) - (b[sortKey] as number);
      if (sortKey === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      return sortDir === "asc" ? (a[sortKey] as number) - (b[sortKey] as number) : (b[sortKey] as number) - (a[sortKey] as number);
    });
    return list;
  }, [search, filterLevel, filterFaculty, filterIntervention, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className={`ml-1 text-xs ${sortKey === k ? "text-[var(--color-primary)]" : "text-slate-300"}`}>
      {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>Danh sách Sinh viên Cần theo dõi</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tổng: {students.length} sinh viên · Đang hiển thị: {filtered.length}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setExportMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Xuất file</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {exportMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={() => setExportMenu(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                Xuất Excel (.xlsx)
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={() => setExportMenu(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Xuất PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã sinh viên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          {/* Level filter */}
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value as WarningLevel | "all")}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
          >
            <option value="all">Tất cả mức cảnh báo</option>
            <option value="red">🔴 Đỏ – Khẩn cấp</option>
            <option value="yellow">🟡 Vàng – Chú ý</option>
            <option value="green">🟢 Xanh – Bình thường</option>
          </select>

          {/* Faculty */}
          <select
            value={filterFaculty}
            onChange={e => setFilterFaculty(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
          >
            <option value="all">Tất cả khoa</option>
            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Intervention status */}
          <select
            value={filterIntervention}
            onChange={e => setFilterIntervention(e.target.value as InterventionStatus | "all")}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="none">Chưa liên hệ</option>
            <option value="contacted">Đã liên hệ</option>
            <option value="monitoring">Đang theo dõi</option>
            <option value="resolved">Đã xử lý</option>
          </select>

          {(search || filterLevel !== "all" || filterFaculty !== "all" || filterIntervention !== "all") && (
            <button
              onClick={() => { setSearch(""); setFilterLevel("all"); setFilterFaculty("all"); setFilterIntervention("all"); }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              × Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Mã SV</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-700" onClick={() => handleSort("name")}>
                  Họ tên <SortIcon k="name" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Lớp / Khoa</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Mức cảnh báo</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-700" onClick={() => handleSort("riskScore")}>
                  Rủi ro <SortIcon k="riskScore" />
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-700" onClick={() => handleSort("currentGPA")}>
                  GPA <SortIcon k="currentGPA" />
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-700" onClick={() => handleSort("trainingScore")}>
                  Rèn luyện <SortIcon k="trainingScore" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Can thiệp</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">Không tìm thấy sinh viên nào phù hợp</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className={`border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`} onClick={() => onViewStudent(s.id)}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-500">{s.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-400">{s.major}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{s.className}</div>
                    <div className="text-xs text-slate-400">{s.faculty}</div>
                  </td>
                  <td className="px-4 py-3">
                    <WarningBadge level={s.warningLevel} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${s.riskScore}%`,
                          background: s.riskScore >= 75 ? "#DC2626" : s.riskScore >= 55 ? "#EA580C" : s.riskScore >= 35 ? "#EAB308" : "#22C55E"
                        }} />
                      </div>
                      <span className="font-mono font-bold text-xs w-6 text-right" style={{
                        color: s.riskScore >= 75 ? "#DC2626" : s.riskScore >= 55 ? "#EA580C" : s.riskScore >= 35 ? "#CA8A04" : "#16A34A"
                      }}>{s.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-semibold text-xs" style={{
                      color: s.currentGPA < 2.0 ? "#DC2626" : s.currentGPA < 2.5 ? "#EA580C" : "#0F172A"
                    }}>
                      {s.currentGPA.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 ml-0.5">{s.gpaTrend === "up" ? " ▲" : s.gpaTrend === "down" ? " ▼" : " –"}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{s.trainingScore}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${interventionColors[s.interventionStatus]}`}>
                      {interventionLabels[s.interventionStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary)] text-xs font-medium"
                      onClick={e => { e.stopPropagation(); onViewStudent(s.id); }}
                    >
                      Xem →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
