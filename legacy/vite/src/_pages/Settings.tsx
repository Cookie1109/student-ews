import { useState } from "react";
import { warningConfig } from "../data/mockData";

export default function Settings() {
  const [config, setConfig] = useState(warningConfig);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>Cấu hình hệ thống</h1>
        <p className="text-sm text-slate-500 mt-0.5">Thiết lập ngưỡng cảnh báo và trọng số tính điểm rủi ro</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPA thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Ngưỡng GPA</h2>
          {[
            { key: "redGPA", label: "Ngưỡng Đỏ (≤)", color: "text-red-600", desc: "Dưới mức này → Cảnh báo đỏ" },
            { key: "yellowGPA", label: "Ngưỡng Vàng (≤)", color: "text-yellow-600", desc: "Dưới mức này → Cảnh báo vàng" },
          ].map(({ key, label, color, desc }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${color}`}>{label}</label>
                <span className="text-xs text-slate-400">{desc}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="1.0" max="3.5" step="0.1"
                  value={config[key as keyof typeof config] as number}
                  onChange={e => setConfig(c => ({ ...c, [key]: parseFloat(e.target.value) }))}
                  className="flex-1 accent-[var(--color-primary)]"
                />
                <span className="w-12 text-center font-mono font-bold text-slate-700 bg-slate-100 rounded-lg py-1 text-sm">
                  {(config[key as keyof typeof config] as number).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Training score thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Ngưỡng Điểm Rèn luyện</h2>
          {[
            { key: "redTraining", label: "Ngưỡng Đỏ (≤)", color: "text-red-600", desc: "Điểm rèn luyện rất kém" },
            { key: "yellowTraining", label: "Ngưỡng Vàng (≤)", color: "text-yellow-600", desc: "Điểm rèn luyện trung bình" },
          ].map(({ key, label, color, desc }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${color}`}>{label}</label>
                <span className="text-xs text-slate-400">{desc}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="10" max="90" step="5"
                  value={config[key as keyof typeof config] as number}
                  onChange={e => setConfig(c => ({ ...c, [key]: parseInt(e.target.value) }))}
                  className="flex-1 accent-[var(--color-primary)]"
                />
                <span className="w-12 text-center font-mono font-bold text-slate-700 bg-slate-100 rounded-lg py-1 text-sm">
                  {config[key as keyof typeof config] as number}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Weights */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Trọng số Điểm Rủi ro</h2>
            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              Tổng: {config.weights.academic + config.weights.training + config.weights.activity}%
            </span>
          </div>
          {[
            { key: "academic", label: "Học tập", color: "#1D4ED8" },
            { key: "training", label: "Rèn luyện", color: "#9333EA" },
            { key: "activity", label: "Hoạt động", color: "#0891B2" },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-slate-700 font-medium">{label}</label>
                <span className="font-mono font-bold text-sm" style={{ color }}>{config.weights[key as keyof typeof config.weights]}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${config.weights[key as keyof typeof config.weights]}%`, background: color }} />
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
            Tổng ba trọng số phải bằng 100% để đảm bảo tính toán chính xác
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Xem trước – Phân loại mức cảnh báo</h2>
          <div className="space-y-3">
            {[
              { dot: "bg-red-500", level: "Đỏ", range: `GPA ≤ ${config.redGPA.toFixed(1)} HOẶC Rèn luyện ≤ ${config.redTraining}`, color: "bg-red-50 border-red-200 text-red-700" },
              { dot: "bg-yellow-400", level: "Vàng", range: `GPA ≤ ${config.yellowGPA.toFixed(1)} HOẶC Rèn luyện ≤ ${config.yellowTraining}`, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
              { dot: "bg-green-500", level: "Xanh", range: "Vượt qua tất cả các ngưỡng trên", color: "bg-green-50 border-green-200 text-green-700" },
            ].map(item => (
              <div key={item.level} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${item.color}`}>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.dot}`} />
                <span className="font-semibold w-12 flex-shrink-0">{item.level}</span>
                <span className="text-xs opacity-80">{item.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log/audit section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Nhật ký hành động gần đây</h2>
        <div className="space-y-2">
          {[
            { time: "2024-12-15 09:32", user: "Admin Nguyễn", action: "Upload dữ liệu học tập HK1 2024-25 (500 bản ghi)" },
            { time: "2024-12-14 14:18", user: "Admin Nguyễn", action: "Upload điểm rèn luyện HK1 2024-25 (500 bản ghi)" },
            { time: "2024-12-10 11:05", user: "ThS. Nguyễn Thị Hoa", action: "Xem hồ sơ sinh viên SV001 – Nguyễn Văn An" },
            { time: "2024-12-05 14:22", user: "ThS. Nguyễn Thị Hoa", action: "Thêm nhật ký can thiệp cho SV001" },
            { time: "2024-11-28 09:00", user: "Admin Nguyễn", action: "Sửa ngưỡng GPA đỏ từ 1.5 → 1.6" },
          ].map((log, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0 text-sm">
              <span className="font-mono text-xs text-slate-400 flex-shrink-0 pt-0.5">{log.time}</span>
              <span className="text-[var(--color-primary)] font-medium flex-shrink-0">{log.user}</span>
              <span className="text-slate-600">{log.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Đã lưu cấu hình
          </span>
        )}
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors shadow-sm"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Lưu cấu hình
        </button>
      </div>
    </div>
  );
}
