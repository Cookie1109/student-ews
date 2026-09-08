import { create } from 'zustand';

interface DashboardState {
  totalStudents: number;
  redWarnings: number;
  yellowWarnings: number;
  greenStudents: number;
  // TODO: Add functions to fetch or update these stats
}

export const useDashboardStore = create<DashboardState>((set) => ({
  totalStudents: 0,
  redWarnings: 0,
  yellowWarnings: 0,
  greenStudents: 0,
}));
