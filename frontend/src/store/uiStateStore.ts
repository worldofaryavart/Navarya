import create from 'zustand';

interface UIState {
  currentPage: string;
  taskFilter: string;
  searchQuery: string;
  selectedPriority: string | null;
  setCurrentPage: (page: string) => void;
  setTaskFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPriority: (priority: string | null) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentPage: '/',
  taskFilter: 'All',
  searchQuery: '',
  selectedPriority: null,

  setCurrentPage: (page) => set({ currentPage: page }),
  setTaskFilter: (filter) => set({ taskFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedPriority: (priority) => set({ selectedPriority: priority }),
  resetFilters: () => set({ 
    taskFilter: 'All', 
    searchQuery: '', 
    selectedPriority: null 
  }),
}));
