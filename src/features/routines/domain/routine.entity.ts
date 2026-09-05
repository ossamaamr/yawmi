import { RoutineItem } from './routine.types';

export function isRoutineComplete(items: RoutineItem[]): boolean {
  if (items.length === 0) return false;
  return items.every((item) => item.isCompleted);
}

export function getRoutineProgress(items: RoutineItem[]): number {
  if (items.length === 0) return 0;
  const completed = items.filter((item) => item.isCompleted).length;
  return completed / items.length;
}

export function sortRoutineItems(items: RoutineItem[]): RoutineItem[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}
