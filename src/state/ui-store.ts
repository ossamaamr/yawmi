import { create } from 'zustand';
import type { TaskRecord } from '../features/tasks/application/task.repository';

interface UIState {
  selectedTask: TaskRecord | null;
  searchQuery: string;
  isQuickAddOpen: boolean;

  setSelectedTask: (task: TaskRecord | null) => void;
  setSearchQuery: (query: string) => void;
  setQuickAddOpen: (open: boolean) => void;
  toggleQuickAdd: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTask: null,
  searchQuery: '',
  isQuickAddOpen: false,

  setSelectedTask: (task) => set({ selectedTask: task }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
  toggleQuickAdd: () => set((state) => ({ isQuickAddOpen: !state.isQuickAddOpen })),
}));
