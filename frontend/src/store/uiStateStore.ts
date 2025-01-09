import create from 'zustand';

interface TaskFilter {
  status: string | null;
  priority: string | null;
  due: string | null;
  created: string | null;
}

interface UIState {
  currentPage: string;
  taskFilter: TaskFilter;
  searchQuery: string;
  setCurrentPage: (page: string) => void;
  setTaskFilter: (filter: Partial<TaskFilter>) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentPage: '/',
  taskFilter: {
    status: null,
    priority: null,
    due: null,
    created: null
  },
  searchQuery: '',

  setCurrentPage: (page) => set({ currentPage: page }),
  
  setTaskFilter: (filter) => set((state) => ({ 
    taskFilter: { ...state.taskFilter, ...filter } 
  })),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  resetFilters: () => set({ 
    taskFilter: {
      status: null,
      priority: null,
      due: null,
      created: null
    },
    searchQuery: '' 
  }),
}));
