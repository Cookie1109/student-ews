export type Page = "dashboard" | "students" | "upload" | "reports" | "settings";
import type { Role } from "../stores/authStore";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
}

const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  students: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  menu: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
};

const navItems: { id: Page; label: string; iconKey: keyof typeof Icons; roles: Role[] }[] = [
  { id: "dashboard", label: "Dashboard", iconKey: "dashboard", roles: ["SYSTEM_ADMIN", "FACULTY_BOARD", "CLASS_ADVISOR", "FACULTY_STAFF", "STUDENT_AFFAIRS_ASSISTANT", "COMMS_ASSISTANT"] },
  { id: "students", label: "Danh sách SV", iconKey: "students", roles: ["SYSTEM_ADMIN", "FACULTY_BOARD", "CLASS_ADVISOR", "FACULTY_STAFF", "STUDENT_AFFAIRS_ASSISTANT"] },
  { id: "upload", label: "Nhập dữ liệu", iconKey: "upload", roles: ["SYSTEM_ADMIN", "STUDENT_AFFAIRS_ASSISTANT"] },
  { id: "reports", label: "Báo cáo", iconKey: "reports", roles: ["SYSTEM_ADMIN", "FACULTY_BOARD", "CLASS_ADVISOR", "FACULTY_STAFF", "STUDENT_AFFAIRS_ASSISTANT", "COMMS_ASSISTANT"] },
  { id: "settings", label: "Cấu hình", iconKey: "settings", roles: ["SYSTEM_ADMIN"] },
];

const roleColors: Record<Role, string> = {
  SYSTEM_ADMIN: "bg-gray-100 text-gray-600",
  FACULTY_BOARD: "bg-orange-50 text-orange-600",
  CLASS_ADVISOR: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  FACULTY_STAFF: "bg-blue-50 text-blue-600",
  STUDENT_AFFAIRS_ASSISTANT: "bg-purple-50 text-purple-600",
  COMMS_ASSISTANT: "bg-teal-50 text-teal-600",
};

export default function Sidebar({ currentPage, onNavigate, role, collapsed, onToggle }: SidebarProps) {
  const filtered = navItems.filter(item => item.roles.includes(role));

  return (
    <aside
      className="flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-all duration-200 select-none z-20"
      style={{ width: collapsed ? 64 : 220, minWidth: collapsed ? 64 : 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--color-border)]" style={{ height: 64 }}>
        <div
          className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 tracking-wide"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          DLU
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm leading-tight truncate text-[var(--color-text)]" style={{ fontFamily: "Outfit, sans-serif" }}>Hệ thống Cảnh báo</div>
            <div className="text-xs text-[var(--color-text-secondary)] truncate">Đại học Đà Lạt</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors flex-shrink-0 cursor-pointer p-0.5 rounded"
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? Icons.menu : Icons.chevronLeft}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface2)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)]">
              {role === "SYSTEM_ADMIN" ? "AD" : role === "FACULTY_BOARD" ? "TK" : role === "CLASS_ADVISOR" ? "CV" : role === "FACULTY_STAFF" ? "GV" : role === "STUDENT_AFFAIRS_ASSISTANT" ? "CT" : "TT"}
            </div>
            <div>
              <div className="text-[11px] text-[var(--color-text-secondary)] mb-0.5">Vai trò hiện tại</div>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${roleColors[role]}`}>
                {role === "SYSTEM_ADMIN" ? "Admin" : role === "FACULTY_BOARD" ? "Trưởng khoa" : role === "CLASS_ADVISOR" ? "CVHT" : role === "FACULTY_STAFF" ? "Giáo vụ" : role === "STUDENT_AFFAIRS_ASSISTANT" ? "CTSV" : "Truyền thông"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {filtered.map(item => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group ${
                active
                  ? "bg-[var(--color-active-light)] text-[var(--color-active)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface2)] hover:text-[var(--color-text)]"
              }`}
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              <span className={`flex-shrink-0 transition-colors ${active ? "text-[var(--color-active)]" : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]"}`}>
                {Icons[item.iconKey]}
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-active)] flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[var(--color-border)]">
        {!collapsed ? (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] flex-shrink-0"></span>
            <span>HK1 2024–2025</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)]"></span>
          </div>
        )}
      </div>
    </aside>
  );
}
