import { create } from 'zustand';
import type { TaskRecord } from '../features/tasks/application/task.repository';
import {
  getTodayItems,
  getOverdueTasks,
  completeTask as repoCompleteTask,
} from '../features/tasks/application/task.repository';

interface TaskState {
  todayTasks: TaskRecord[];
  overdueTasks: TaskRecord[];
  completedToday: TaskRecord[];
  loading: boolean;
  error: string | null;

  loadTodayTasks: () => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  todayTasks: [],
  overdueTasks: [],
  completedToday: [],
  loading: false,
  error: null,

  loadTodayTasks: async () => {
    set({ loading: true, error: null });
    try {
      const [today, overdue] = await Promise.all([
        getTodayItems(),
        getOverdueTasks(),
      ]);

      const completed = today.filter((t) => t.status === 'completed');
      const pending = today.filter((t) => t.status !== 'completed');

      set({
        todayTasks: pending,
        overdueTasks: overdue,
        completedToday: completed,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load tasks',
      });
    }
  },

  completeTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const completed = await repoCompleteTask(id);
      if (!completed) {
        set({ loading: false, error: 'Task already completed or not found' });
        return;
      }

      const { todayTasks, completedToday } = get();
      const updatedToday = todayTasks.map((t) => (t.id === id ? completed : t));
      const updatedCompleted =
        completed.status === 'completed'
          ? [...completedToday, completed]
          : completedToday;

      set({
        todayTasks: updatedToday,
        completedToday: updatedCompleted,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to complete task',
      });
    }
  },

  refreshTasks: async () => {
    await get().loadTodayTasks();
  },
}));
