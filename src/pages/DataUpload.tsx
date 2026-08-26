import { useState } from "react";
import { uploadHistory } from "../data/mockData";

type UploadType = "academic" | "training" | "activity";

const typeIcons = {
  academic: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  training: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  activity: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
};

const typeConfig = {
  academic: { label: "Kết quả học tập", color: "blue", desc: "File Excel chứa GPA, số tín chỉ tích lũy, số môn học theo từng học kỳ" },
  training: { label: "Điểm rèn luyện", color: "purple", desc: "File Excel chứa điểm rèn luyện theo từng học kỳ" },
  activity: { label: "Hoạt động ngoại khóa", color: "teal", desc: "File Excel chứa điểm hoạt động đoàn thể, cộng đồng, phong trào" },
};

const colorMap: Record<string, string> = {
  blue: "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  teal: "bg-teal-50 border-teal-200 text-teal-700",
};

const typeLabelMap: Record<string, string> = {
  academic: "Học tập",
  training: "Rèn luyện",
  activity: "Hoạt động",
};

type UploadState = "idle" | "dragging" | "validating" | "success" | "error";

export default function DataUpload() {
  const [activeType, setActiveType] = useState<UploadType>("academic");
  const [semester, setSemester] = useState("HK1 2024-25");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const simulateUpload = (name: string) => {
    setFileName(name);
    setUploadState("validating");
    setTimeout(() => {
      setUploadState(Math.random() > 0.3 ? "success" : "error");
    }, 1800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState("idle");
    const file = e.dataTransfer.files[0];
    if (file) simulateUpload(file.name);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file.name);
  };

  const mockErrors = uploadHistory.find(u => u.type === activeType)?.errors ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>Nhập dữ liệu</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload dữ liệu học kỳ để hệ thống tính toán mức cảnh báo</p>
        </div>
        <button
          onClick={() => setShowHistory(v => !v)}
          className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-80 font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          {showHistory ? "Ẩn lịch sử" : "Lịch sử nhập"}
        </button>
      </div>

      {/* Data type selector */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(typeConfig) as [UploadType, typeof typeConfig.academic][]).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => { setActiveType(type); setUploadState("idle"); setFileName(""); }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              activeType === type
                ? "border-[var(--color-active)] bg-[var(--color-active-light)] shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className={`mb-2 ${activeType === type ? "text-[var(--color-active)]" : "text-slate-400"}`}>{typeIcons[type]}</div>
            <div className={`font-semibold text-sm ${activeType === type ? "text-[var(--color-active)]" : "text-slate-700"}`} style={{ fontFamily: "Outfit, sans-serif" }}>
              {cfg.label}
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">{cfg.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload zone */}
        <div className="lg:col-span-2 space-y-4">
          {/* Semester select */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Học kỳ</label>
              <select value={semester} onChange={e => setSemester(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white">
                <option>HK1 2024-25</option>
                <option>HK2 2023-24</option>
                <option>HK1 2023-24</option>
                <option>HK2 2022-23</option>
              </select>
            </div>
            <div className="flex-1"></div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Tải file mẫu
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setUploadState("dragging"); }}
            onDragLeave={() => uploadState === "dragging" && setUploadState("idle")}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
              uploadState === "dragging" ? "border-[var(--color-active)] bg-[var(--color-active-light)]" :
              uploadState === "success" ? "border-green-400 bg-green-50" :
              uploadState === "error" ? "border-red-300 bg-red-50" :
              "border-slate-200 bg-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/30"
            }`}
          >
            <label className="flex flex-col items-center justify-center py-14 cursor-pointer">
              <input type="file" accept=".xlsx,.csv,.xls" onChange={handleFileInput} className="hidden" />
              {uploadState === "idle" || uploadState === "dragging" ? (
                <>
                  <div className="mb-4 text-slate-300"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
                  <p className="font-semibold text-slate-700 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {uploadState === "dragging" ? "Thả file để tải lên" : "Kéo thả file hoặc click để chọn"}
                  </p>
                  <p className="text-sm text-slate-400">Hỗ trợ: .xlsx, .xls, .csv · Tối đa 10MB</p>
                </>
              ) : uploadState === "validating" ? (
                <>
                  <div className="mb-4 text-[var(--color-primary)] animate-spin"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>
                  <p className="font-semibold text-[var(--color-primary)]" style={{ fontFamily: "Outfit, sans-serif" }}>Đang kiểm tra dữ liệu...</p>
                  <p className="text-sm text-[var(--color-primary)] mt-1">{fileName}</p>
                  <div className="mt-4 w-48 h-1.5 bg-[var(--color-primary-light)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                </>
              ) : uploadState === "success" ? (
                <>
                  <div className="mb-4 text-green-500"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
                  <p className="font-semibold text-green-700 text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>Nhập dữ liệu thành công!</p>
                  <p className="text-sm text-green-600 mt-1">{fileName}</p>
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className="text-green-600 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>493 bản ghi thành công</span>
                    <span className="text-red-500 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>7 bản ghi lỗi</span>
                  </div>
                  <button onClick={() => { setUploadState("idle"); setFileName(""); }} className="mt-3 text-xs text-slate-500 hover:text-slate-700 underline">Tải file khác</button>
                </>
              ) : (
                <>
                  <div className="mb-4 text-red-500"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
                  <p className="font-semibold text-red-700 text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>Có lỗi khi nhập dữ liệu</p>
                  <p className="text-sm text-red-500 mt-1">{fileName}</p>
                  <button onClick={() => { setUploadState("idle"); setFileName(""); }} className="mt-3 text-xs text-slate-500 hover:text-slate-700 underline">Thử lại</button>
                </>
              )}
            </label>
          </div>

          {/* Error list */}
          {(uploadState === "success" || uploadState === "error") && mockErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="font-semibold text-red-700 mb-3 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Chi tiết lỗi ({mockErrors.length} dòng)</h4>
              <div className="space-y-2">
                {mockErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="font-mono text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">Dòng {err.line}</span>
                    <span className="text-red-600">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Cấu trúc file bắt buộc</h3>
            <div className="space-y-2">
              {activeType === "academic" && [
                "Mã SV (bắt buộc)",
                "Học kỳ (bắt buộc)",
                "GPA (0.0 – 4.0)",
                "Số tín chỉ tích lũy",
                "Số môn không đạt",
              ].map(col => (
                <div key={col} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                  <span className="text-slate-600">{col}</span>
                </div>
              ))}
              {activeType === "training" && [
                "Mã SV (bắt buộc)",
                "Học kỳ (bắt buộc)",
                "Điểm rèn luyện (0 – 100)",
                "Xếp loại rèn luyện",
              ].map(col => (
                <div key={col} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                  <span className="text-slate-600">{col}</span>
                </div>
              ))}
              {activeType === "activity" && [
                "Mã SV (bắt buộc)",
                "Học kỳ (bắt buộc)",
                "Điểm hoạt động (0 – 100)",
                "Số buổi tham gia",
              ].map(col => (
                <div key={col} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                  <span className="text-slate-600">{col}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-800 mb-2 text-sm flex items-center gap-1.5" style={{ fontFamily: "Outfit, sans-serif" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Lưu ý quan trọng
            </h3>
            <ul className="space-y-1.5 text-xs text-amber-700">
              <li>• Mã SV phải tồn tại trong hệ thống</li>
              <li>• Không được để trống các cột bắt buộc</li>
              <li>• Dữ liệu sẽ ghi đè lên lần nhập trước cùng kỳ</li>
              <li>• Hệ thống tự động tính lại cảnh báo sau khi nhập</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload history */}
      {showHistory && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Lịch sử nhập dữ liệu</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Học kỳ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Người nhập</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Thời gian</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Thành công</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Lỗi</th>
              </tr>
            </thead>
            <tbody>
              {uploadHistory.map(h => (
                <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      h.type === "academic" ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]" :
                      h.type === "training" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-teal-50 text-teal-700 border-teal-200"
                    }`}>
                      {typeLabelMap[h.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{h.semester}</td>
                  <td className="px-4 py-3 text-slate-600">{h.uploadedBy}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{h.uploadedAt}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{h.totalRecords}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-green-600">{h.successRecords}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs">
                    <span className={h.errorRecords > 0 ? "text-red-500 font-semibold" : "text-slate-400"}>{h.errorRecords}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
