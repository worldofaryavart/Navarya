import { create } from 'zustand';

interface TaskFilter {
  status: string;
  priority: string;
  due: string;
  created: string;
}

interface UIState {
  currentPage: string;
  taskFilter: TaskFilter;
  searchQuery: string;
  selectedDate: Date;
  reminderCount: number;
  setCurrentPage: (page: string) => void;
  setTaskFilter: (filter: Partial<TaskFilter>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: Date) => void;
  setReminderCount: (count: number) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  currentPage: '/',
  taskFilter: {
    status: 'All',
    priority: 'All',
    due: '',
    created: '',
  },
  searchQuery: '',
  selectedDate: new Date(),
  reminderCount: 0,

  setCurrentPage: (page) => set({ currentPage: page }),
  
  setTaskFilter: (filter) => set((state) => ({
    taskFilter: { ...state.taskFilter, ...filter },
  })),
  
  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedDate: (date) => set({ selectedDate: date }),
  
  setReminderCount: (count) => set({ reminderCount: count }),
  
  resetFilters: () => set({
    taskFilter: {
      status: 'All',
      priority: 'All',
      due: '',
      created: '',
    },
    searchQuery: '',
    selectedDate: new Date(),
    reminderCount: 0
  }),
}));
