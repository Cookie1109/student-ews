import { create } from 'zustand';

interface FilterState {
  facultyId: string | null;
  cohortId: string | null;
  classId: string | null;
  severity: 'VANG' | 'DO' | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED' | null;
  ruleCode: string | null;
  searchQuery: string;
  setFilter: (key: keyof Omit<FilterState, 'setFilter' | 'clearFilters'>, value: any) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  facultyId: null,
  cohortId: null,
  classId: null,
  severity: null,
  status: null,
  ruleCode: null,
  searchQuery: '',
  setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),
  clearFilters: () => set({
    facultyId: null,
    cohortId: null,
    classId: null,
    severity: null,
    status: null,
    ruleCode: null,
    searchQuery: ''
  })
}));
