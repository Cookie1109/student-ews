"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardCheck, Plus, Search, Users } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

type Activity = {
  id: string;
  sourceCode: string;
  name: string;
  type: string;
  organizingUnit: string | null;
  academicTermId: string | null;
  startDate: string | null;
  endDate: string | null;
  targetAudience: string | null;
  description: string | null;
  participation: { total: number; registered: number; attended: number; completed: number };
};

type Participation = {
  id: string;
  studentId: string;
  status: "registered" | "attended" | "completed";
  evidence: string | null;
  student: { sStudentId: string; sFullName: string; sClassStudentId: string | null } | null;
};

type StudentOption = { id: string; studentCode: string; fullName: string; classStudentId?: string | null };

const statusMeta = {
  registered: { label: "Đã đăng ký", className: "bg-slate-100 text-slate-700" },
  attended: { label: "Đã tham dự", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-700" },
};

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleDateString("vi-VN")
  : "Chưa xác định";

export default function ActivitiesPage() {
  const canManage = useAuthStore((state) => state.can("activity.manage"));
  const [items, setItems] = useState<Activity[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [terms, setTerms] = useState<Array<{ value: string; label: string }>>([]);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [academicTermId, setAcademicTermId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    sourceCode: "", name: "", type: "Học thuật", organizingUnit: "",
    academicTermId: "", startDate: "", endDate: "", targetAudience: "", description: "",
  });
  const [participationForm, setParticipationForm] = useState({ studentId: "", status: "registered", evidence: "" });

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ pageSize: "100" });
    if (q.trim()) params.set("q", q.trim());
    if (type) params.set("type", type);
    if (academicTermId) params.set("academicTermId", academicTermId);
    try {
      const response = await fetch(`/api/v1/activities?${params}`);
      if (!response.ok) throw new Error("Không thể tải danh sách hoạt động");
      const payload = await response.json();
      setItems(payload.items || []);
      setSelected((current) => current
        ? (payload.items || []).find((item: Activity) => item.id === current.id) || null
        : null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [academicTermId, q, type]);

  useEffect(() => {
    queueMicrotask(() => void loadActivities());
  }, [loadActivities]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/v1/dashboard/summary?pageSize=1").then((response) => response.ok ? response.json() : null),
      fetch("/api/v1/students?pageSize=100").then((response) => response.ok ? response.json() : null),
    ]).then(([dashboard, studentPayload]) => {
      setTerms((dashboard?.filterOptions?.terms || []).map((term: { value: string; label: string }) => term));
      setStudents((studentPayload?.items || []).map((student: Record<string, unknown>) => ({
        id: String(student.id || ""),
        studentCode: String(student.studentCode || student.sStudentId || ""),
        fullName: String(student.fullName || student.sFullName || ""),
        classStudentId: student.classStudentId || student.sClassStudentId
          ? String(student.classStudentId || student.sClassStudentId)
          : null,
      })));
    });
  }, []);

  const loadParticipations = useCallback(async (activity: Activity) => {
    setSelected(activity);
    const response = await fetch(`/api/v1/activities/${activity.id}/participations`);
    if (response.ok) setParticipations((await response.json()).items || []);
  }, []);

  const types = useMemo(() => [...new Set(items.map((item) => item.type))].sort(), [items]);

  async function createActivity(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/v1/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        academicTermId: form.academicTermId || null,
        conductTermId: form.academicTermId || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message || "Không thể tạo hoạt động");
      return;
    }
    setShowCreate(false);
    setForm({ sourceCode: "", name: "", type: "Học thuật", organizingUnit: "", academicTermId: "", startDate: "", endDate: "", targetAudience: "", description: "" });
    await loadActivities();
  }

  async function addParticipation(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const response = await fetch(`/api/v1/activities/${selected.id}/participations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(participationForm),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message || "Không thể ghi nhận tham gia");
      return;
    }
    setParticipationForm({ studentId: "", status: "registered", evidence: "" });
    await Promise.all([loadParticipations(selected), loadActivities()]);
  }

  async function updateStatus(row: Participation, status: Participation["status"]) {
    if (!selected) return;
    const response = await fetch(`/api/v1/activities/${selected.id}/participations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: row.studentId, status, evidence: row.evidence }),
    });
    if (response.ok) await Promise.all([loadParticipations(selected), loadActivities()]);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Rèn luyện & tham gia</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Hoạt động sinh viên</h1>
          <p className="mt-1 text-sm text-slate-500">Ghi nhận đăng ký, tham dự và xác nhận hoàn thành theo từng học kỳ.</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus size={16} /> Tạo hoạt động
          </button>
        )}
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showCreate && canManage && (
        <form onSubmit={createActivity} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
          <input required placeholder="Mã hoạt động" value={form.sourceCode} onChange={(e) => setForm({ ...form, sourceCode: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input required placeholder="Tên hoạt động" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-2" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {['Học thuật', 'Chính trị', 'Xã hội', 'Văn hóa', 'Thể thao', 'Tình nguyện'].map((value) => <option key={value}>{value}</option>)}
          </select>
          <input placeholder="Đơn vị tổ chức" value={form.organizingUnit} onChange={(e) => setForm({ ...form, organizingUnit: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <select value={form.academicTermId} onChange={(e) => setForm({ ...form, academicTermId: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Chọn học kỳ</option>
            {terms.map((term) => <option key={term.value} value={term.value}>{term.label}</option>)}
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input placeholder="Đối tượng tham gia" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
          <input placeholder="Mô tả ngắn" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
          <div className="flex justify-end gap-2 md:col-span-2 lg:col-span-4">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Hủy</button>
            <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Lưu hoạt động</button>
          </div>
        </form>
      )}

      <section className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tên, đơn vị tổ chức..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm" />
        </label>
        <select value={academicTermId} onChange={(e) => setAcademicTermId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="">Tất cả học kỳ</option>
          {terms.map((term) => <option key={term.value} value={term.value}>{term.label}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="">Tất cả loại</option>
          {types.map((value) => <option key={value}>{value}</option>)}
        </select>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,.7fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Danh sách hoạt động</h2>
            <p className="text-xs text-slate-500">{items.length} hoạt động trong phạm vi lọc</p>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? <p className="p-8 text-center text-sm text-slate-400">Đang tải...</p> : items.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">Chưa có hoạt động phù hợp.</p> : items.map((item) => (
              <button key={item.id} onClick={() => void loadParticipations(item)} className={`w-full p-5 text-left transition hover:bg-slate-50 ${selected?.id === item.id ? 'bg-emerald-50/60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700">{item.sourceCode}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{item.type}</span>
                    </div>
                    <h3 className="mt-1 font-bold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{item.organizingUnit || 'Chưa có đơn vị'} · {formatDate(item.startDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-black text-slate-900">{item.participation.total}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">lượt tham gia</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <span className="rounded-lg bg-slate-50 px-2 py-1.5">Đăng ký <b>{item.participation.registered}</b></span>
                  <span className="rounded-lg bg-blue-50 px-2 py-1.5 text-blue-700">Tham dự <b>{item.participation.attended}</b></span>
                  <span className="rounded-lg bg-emerald-50 px-2 py-1.5 text-emerald-700">Hoàn thành <b>{item.participation.completed}</b></span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
          {!selected ? (
            <div className="p-10 text-center text-slate-400"><ClipboardCheck className="mx-auto mb-3" size={32} /><p className="text-sm">Chọn một hoạt động để xem người tham gia.</p></div>
          ) : (
            <>
              <div className="border-b border-slate-100 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{selected.sourceCode}</p>
                <h2 className="mt-1 font-bold text-slate-950">{selected.name}</h2>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><CalendarDays size={14} />{formatDate(selected.startDate)}</span><span className="flex items-center gap-1"><Users size={14} />{participations.length} sinh viên</span></div>
              </div>
              {canManage && (
                <form onSubmit={addParticipation} className="space-y-3 border-b border-slate-100 bg-slate-50/70 p-4">
                  <select required value={participationForm.studentId} onChange={(e) => setParticipationForm({ ...participationForm, studentId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">Chọn sinh viên</option>
                    {students.map((student) => <option key={student.id} value={student.id}>{student.studentCode} · {student.fullName}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <select value={participationForm.status} onChange={(e) => setParticipationForm({ ...participationForm, status: e.target.value })} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                      <option value="registered">Đăng ký</option><option value="attended">Đã tham dự</option><option value="completed">Hoàn thành</option>
                    </select>
                    <button className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Ghi nhận</button>
                  </div>
                  <input placeholder="Minh chứng (URL/mã hồ sơ)" value={participationForm.evidence} onChange={(e) => setParticipationForm({ ...participationForm, evidence: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                </form>
              )}
              <div className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
                {participations.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">Chưa ghi nhận người tham gia.</p> : participations.map((row) => (
                  <div key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-bold text-slate-900">{row.student?.sFullName || row.studentId}</p><p className="text-xs text-slate-500">{row.student?.sStudentId} · {row.student?.sClassStudentId || 'Chưa phân lớp'}</p></div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusMeta[row.status].className}`}>{statusMeta[row.status].label}</span>
                    </div>
                    {canManage && row.status !== "completed" && <div className="mt-3 flex gap-2">{row.status === "registered" && <button onClick={() => void updateStatus(row, "attended")} className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700">Xác nhận tham dự</button>}<button onClick={() => void updateStatus(row, "completed")} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={12} />Hoàn thành</button></div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
