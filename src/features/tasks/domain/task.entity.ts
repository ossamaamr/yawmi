import { Task, CreateTaskInput, TaskStatus } from './task.types';

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function endOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function createTaskEntity(input: CreateTaskInput): Task {
  const now = Date.now();
  return {
    id: generateId(),
    title: input.title,
    description: input.description ?? '',
    status: 'active' as TaskStatus,
    priority: input.priority ?? 'none',
    dueDate: input.dueDate,
    dueTime: input.dueTime ?? null,
    completedAt: null,
    completionSource: null,
    recurrenceRuleId: input.recurrenceRuleId ?? null,
    reminderId: input.reminderId ?? null,
    progressionId: input.progressionId ?? null,
    tags: input.tags ?? [],
    isAllDay: input.isAllDay ?? true,
    createdAt: now,
    updatedAt: now,
  };
}

export function isTaskOverdue(task: Task, currentDate: number): boolean {
  if (task.status !== 'active') return false;

  if (task.isAllDay) {
    return currentDate > endOfDay(task.dueDate);
  }

  if (task.dueTime) {
    const parts = task.dueTime.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const dueDateTime = new Date(task.dueDate);
    dueDateTime.setHours(hours, minutes, 0, 0);
    return currentDate > dueDateTime.getTime();
  }

  return currentDate > endOfDay(task.dueDate);
}

export function isTaskDueOnDate(task: Task, date: number): boolean {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const taskDueDayStart = startOfDay(task.dueDate);

  if (task.isAllDay) {
    return taskDueDayStart >= dayStart && taskDueDayStart <= dayEnd;
  }

  if (task.dueTime) {
    const parts = task.dueTime.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const dueDateTime = new Date(task.dueDate);
    dueDateTime.setHours(hours, minutes, 0, 0);
    const dueTime = dueDateTime.getTime();
    return dueTime >= dayStart && dueTime <= dayEnd;
  }

  return taskDueDayStart >= dayStart && taskDueDayStart <= dayEnd;
}

export function canCompleteTask(task: Task): boolean {
  return task.status === 'active';
}
