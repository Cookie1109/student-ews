import { create } from 'zustand';

export type Role = 'SYSTEM_ADMIN' | 'FACULTY_BOARD' | 'CLASS_ADVISOR' | 'FACULTY_STAFF' | 'STUDENT_AFFAIRS_ASSISTANT' | 'COMMS_ASSISTANT';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  facultyId?: string;
  className?: string; // for CLASS_ADVISOR
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
