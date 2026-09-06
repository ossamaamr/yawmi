// ══════════════════════════════════════════════════════════
// context/TaskContext.jsx — إدارة المهام (CRUD محلي بالكامل)
// ══════════════════════════════════════════════════════════
import { createContext, useContext, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const value = useTasks();
  const memo = useMemo(() => value, [value]);
  return <TaskContext.Provider value={memo}>{children}</TaskContext.Provider>;
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext يجب استخدامه داخل TaskProvider');
  return ctx;
}