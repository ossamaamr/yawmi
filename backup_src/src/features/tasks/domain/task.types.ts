export type Priority = 'none' | 'low' | 'medium' | 'high';

export type TaskStatus = 'active' | 'completed' | 'deleted';

export type CompletionSource = 'manual' | 'notification' | 'quick_action';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: number;
  dueTime: string | null;
  completedAt: number | null;
  completionSource: CompletionSource | null;
  recurrenceRuleId: string | null;
  reminderId: string | null;
  progressionId: string | null;
  tags: string[];
  isAllDay: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate: number;
  dueTime?: string | null;
  recurrenceRuleId?: string | null;
  reminderId?: string | null;
  progressionId?: string | null;
  tags?: string[];
  isAllDay?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: number;
  dueTime?: string | null;
  completedAt?: number | null;
  completionSource?: CompletionSource | null;
  recurrenceRuleId?: string | null;
  reminderId?: string | null;
  progressionId?: string | null;
  tags?: string[];
  isAllDay?: boolean;
}
