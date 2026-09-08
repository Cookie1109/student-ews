"use client";

import { useState } from "react";

type UploadCategory = "grades" | "students" | "decisions";

const categoryConfig: Record<UploadCategory, {
  label: string;
  endpoint: string;
  desc: string;
  sampleFileName: string;
  sampleData: any[];
}> = {
  grades: {
    label: "Kết quả học phần (Điểm)",
    endpoint: "/api/v1/grades/import",
    desc: "Dữ liệu điểm thi học phần, điểm trung bình học kỳ, điểm hệ 4 và hệ 10 để tính toán cảnh báo học vụ",
    sampleFileName: "sample_grades.json",
    sampleData: [
      {
        studentCode: "2246A001",
        courseCode: "CT101",
        academicYear: "2024-2025",
        termCode: "HK01",
        score10: 4.5,
        score4: 1.5,
        passed: true,
      },
      {
        studentCode: "2246A002",
        courseCode: "CT102",
        academicYear: "2024-2025",
        termCode: "HK01",
        score10: 3.0,
        score4: 0.5,
        passed: false,
      },
    ],
  },
  students: {
    label: "Hồ sơ sinh viên",
    endpoint: "/api/v1/students/import",
    desc: "Danh sách sinh viên, mã số SV, họ tên, ngày sinh, lớp quản lý và chương trình đào tạo",
    sampleFileName: "sample_students.json",
    sampleData: [
      {
        studentId: "2446A099",
        firstName: "Văn",
        lastName: "Nguyễn",
        birthDate: "2004-05-15",
        gender: "Nam",
        classStudentId: "CTK48A",
        studyProgramId: "7480201",
      },
    ],
  },
  decisions: {
    label: "Quyết định học vụ",
    endpoint: "/api/v1/decisions/import",
    desc: "Quyết định cảnh báo học vụ, thôi học, tạm dừng tiến độ, khen thưởng hoặc kỷ luật từ Ban Đào tạo",
    sampleFileName: "sample_decisions.json",
    sampleData: [
      {
        studentId: "2246A001",
        decisionNumber: "105/QĐ-ĐHĐL",
        decisionName: "Cảnh báo học vụ lần 1",
        decisionTypeId: 16,
        isAcademicWarning: true,
        academicYear: "2024-2025",
        termCode: "HK01",
      },
    ],
  },
};

export default function UploadPage() {
  const [activeCategory, setActiveCategory] = useState<UploadCategory>("grades");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const currentCfg = categoryConfig[activeCategory];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent((event.target?.result as string) || "");
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent((event.target?.result as string) || "");
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = () => {
    setFileName(currentCfg.sampleFileName);
    setFileContent(JSON.stringify(currentCfg.sampleData, null, 2));
    setImportResult(null);
  };

  const handleExecuteImport = async () => {
    if (!fileContent.trim()) {
      alert("Vui lòng tải lên file hoặc dán nội dung dữ liệu JSON!");
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(fileContent);
      if (!Array.isArray(parsedData)) {
        alert("Dữ liệu nhập vào phải là một danh sách dạng mảng JSON [...]");
        return;
      }
    } catch (e: any) {
      alert("Định dạng dữ liệu không hợp lệ. Vui lòng kiểm tra cú pháp JSON: " + e.message);
      return;
    }

    try {
      setUploading(true);
      setImportResult(null);

      const res = await fetch(currentCfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      const json = await res.json();
      if (res.ok) {
        setImportResult({
          success: true,
          total: Array.isArray(parsedData) ? parsedData.length : json.total,
          imported: json.imported ?? json.total ?? parsedData.length,
          errors: json.errors || [],
        });
      } else {
        setImportResult({
          success: false,
          error: json.error?.message || "Lỗi trong quá trình xử lý nhập dữ liệu",
        });
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        error: err.message || "Lỗi kết nối tới máy chủ",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">
            Trung tâm Đồng bộ Dữ liệu Học vụ
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          Nhập Dữ liệu Học vụ
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Tải lên danh sách hồ sơ sinh viên, kết quả học phần và quyết định học vụ để hệ thống phân tích cảnh báo sớm
        </p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.entries(categoryConfig) as [UploadCategory, typeof categoryConfig.grades][]).map(([cat, cfg]) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setActiveCategory(cat);
              setFileContent("");
              setFileName("");
              setImportResult(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeCategory === cat
                ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/50 shadow-xs ring-1 ring-[var(--color-primary)]"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                activeCategory === cat ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {cat === "grades" ? "📝" : cat === "students" ? "👥" : "📜"}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{cfg.endpoint}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              {cfg.label}
            </h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {cfg.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Tải file hoặc Dán nội dung ({currentCfg.label})
            </h3>
            <p className="text-xs text-slate-400">Hỗ trợ định dạng JSON dạng mảng danh sách bản ghi</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Nạp mẫu dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            dragOver ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/30" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-xs mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p className="text-xs font-semibold text-slate-800">
            Kéo thả file JSON vào đây, hoặc{" "}
            <label className="text-[var(--color-primary)] hover:underline cursor-pointer">
              chọn từ máy tính
              <input
                type="file"
                accept=".json,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dung lượng tối đa 15MB • Tự động giải mã UTF-8</p>

          {fileName && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-xs">
              <span>📄 {fileName}</span>
              <button
                type="button"
                onClick={() => { setFileName(""); setFileContent(""); }}
                className="text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Textarea Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Xem trước & Chỉnh sửa nội dung JSON:</label>
            <span className="text-[11px] text-slate-400 font-mono">
              {fileContent ? `${fileContent.length} ký tự` : "Trống"}
            </span>
          </div>

          <textarea
            rows={8}
            placeholder={`[\n  {\n    "studentCode": "2246A001",\n    ...\n  }\n]`}
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-xl p-4 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Dữ liệu sẽ được đối chiếu theo mã số sinh viên (MSSV) và cập nhật an toàn vào PostgreSQL.
          </div>

          <button
            type="button"
            disabled={uploading || !fileContent.trim()}
            onClick={handleExecuteImport}
            className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang xử lý nhập dữ liệu...</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Thực hiện Nhập Dữ liệu</span>
              </>
            )}
          </button>
        </div>

        {/* Result Message */}
        {importResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
            importResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"
          }`}>
            <div className="font-bold flex items-center gap-2">
              <span>{importResult.success ? "✓ Nhập dữ liệu thành công!" : "✕ Lỗi nhập dữ liệu"}</span>
            </div>
            {importResult.success ? (
              <p>
                Đã xử lý <strong>{importResult.total}</strong> bản ghi, nhập mới/cập nhật thành công <strong>{importResult.imported}</strong> bản ghi.
              </p>
            ) : (
              <p>{importResult.error}</p>
            )}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/60 font-mono text-[11px] text-emerald-800 max-h-32 overflow-y-auto">
                {importResult.errors.map((err: any, i: number) => (
                  <div key={i}>• {err.studentId || err.studentCode || `Dòng ${i + 1}`}: {err.message}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
