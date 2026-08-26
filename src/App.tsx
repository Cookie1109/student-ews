import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar, { type Page } from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import WarningList from "./pages/WarningList";
import StudentDetail from "./pages/StudentDetail";
import DataUpload from "./pages/DataUpload";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { useAuthStore, type Role } from "./stores/authStore";

const roleUsers: Record<Role, { name: string; unit: string }> = {
  SYSTEM_ADMIN: { name: "Admin Hệ thống", unit: "Phòng Kỹ thuật" },
  FACULTY_BOARD: { name: "PGS.TS Lê Văn Hùng", unit: "Ban CN Khoa" },
  CLASS_ADVISOR: { name: "ThS. Nguyễn Thị Hoa", unit: "Khoa CNTT" },
  FACULTY_STAFF: { name: "Cô Nguyễn B", unit: "Giáo vụ Khoa" },
  STUDENT_AFFAIRS_ASSISTANT: { name: "CN. Trần Minh Phúc", unit: "Phòng CTSV" },
  COMMS_ASSISTANT: { name: "Nguyễn Văn A", unit: "Truyền thông" }
};

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const [loginRole, setLoginRole] = useState<Role>("CLASS_ADVISOR");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionTimer] = useState("59:48");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    const userInfo = roleUsers[loginRole];
    login({
      id: "u1",
      username: "demo",
      fullName: userInfo.name,
      role: loginRole,
    });
    navigate('/');
  };

  const handleRoleChange = (newRole: Role) => {
    const userInfo = roleUsers[newRole];
    login({
      id: "u1",
      username: "demo",
      fullName: userInfo.name,
      role: newRole,
    });
    navigate('/');
  };

  const handleNavigate = (p: string) => {
    if (p === 'dashboard') navigate('/');
    else if (p === 'students') navigate('/warnings');
    else if (p === 'upload') navigate('/upload');
    else if (p === 'reports') navigate('/reports');
    else if (p === 'settings') navigate('/settings');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }} />

        <div className="relative z-10 w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl" style={{ fontFamily: "Outfit, sans-serif" }}>
              DLU
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]" style={{ fontFamily: "Outfit, sans-serif" }}>Hệ thống Cảnh báo</h1>
            <p className="text-[var(--color-text-secondary)] mt-1 text-sm">Học vụ Sinh viên</p>
            <p className="text-[var(--color-text-secondary)] text-xs mt-0.5 opacity-60">Trường Đại học Đà Lạt</p>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-xl">
            <h2 className="text-[var(--color-text)] font-semibold text-lg mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Đăng nhập hệ thống</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--color-text-secondary)] font-medium block mb-1.5">Vai trò (demo)</label>
                <select
                  value={loginRole}
                  onChange={e => setLoginRole(e.target.value as Role)}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] appearance-none"
                >
                  <option value="SYSTEM_ADMIN">Quản trị hệ thống</option>
                  <option value="FACULTY_BOARD">Ban chủ nhiệm Khoa</option>
                  <option value="CLASS_ADVISOR">Cố vấn học tập (GVCN)</option>
                  <option value="FACULTY_STAFF">Giáo vụ Khoa</option>
                  <option value="STUDENT_AFFAIRS_ASSISTANT">Trợ lý CTSV</option>
                  <option value="COMMS_ASSISTANT">Trợ lý Truyền thông</option>
                </select>
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-[var(--color-primary)] hover:opacity-90 text-white font-semibold rounded-xl text-sm transition-opacity shadow-sm mt-2 cursor-pointer"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Map route to sidebar selection
  const currentPath = location.pathname;
  let currentPage: Page = "dashboard";
  if (currentPath.startsWith('/warnings')) currentPage = "students";
  else if (currentPath.startsWith('/upload')) currentPage = "upload";
  else if (currentPath.startsWith('/reports')) currentPage = "reports";
  else if (currentPath.startsWith('/settings')) currentPage = "settings";

  return (
    <div className="flex h-screen bg-[var(--color-bg)] overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        role={user.role}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-5 gap-4 flex-shrink-0 z-10">
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)] hidden md:block">Demo vai trò:</span>
            <select
              value={user.role}
              onChange={e => handleRoleChange(e.target.value as Role)}
              className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
            >
              <option value="SYSTEM_ADMIN">Quản trị hệ thống</option>
              <option value="FACULTY_BOARD">Ban chủ nhiệm Khoa</option>
              <option value="CLASS_ADVISOR">Cố vấn học tập (GVCN)</option>
              <option value="FACULTY_STAFF">Giáo vụ Khoa</option>
              <option value="STUDENT_AFFAIRS_ASSISTANT">Trợ lý CTSV</option>
              <option value="COMMS_ASSISTANT">Trợ lý Truyền thông</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 pl-3 border-l border-[var(--color-border)]">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-[var(--color-text)]" style={{ fontFamily: "Outfit, sans-serif" }}>{user.fullName}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">{roleUsers[user.role as Role].unit}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.fullName.split(" ").pop()?.charAt(0)}
            </div>
            <button
              onClick={logout}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-red)] transition-colors ml-1 cursor-pointer"
              title="Đăng xuất"
            >
              ⏻
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard onViewStudent={(id) => navigate(`/warnings/${id}`)} role={user.role} />} />
            <Route path="/warnings" element={<WarningList onViewStudent={(id) => navigate(`/warnings/${id}`)} role={user.role} />} />
            <Route path="/warnings/:id" element={<StudentDetail />} />
            <Route path="/upload" element={<DataUpload />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
