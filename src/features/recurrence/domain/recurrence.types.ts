export type RecurrenceType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'specific_days'
  | 'interval_days';

export interface RecurrenceRule {
  id: string;
  type: RecurrenceType;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
  startDate: number;
  endDate: number | null;
  maxOccurrences: number | null;
  createdAt: number;
  updatedAt: number;
}

export type OccurrenceStatus = 'pending' | 'completed' | 'skipped';

export interface TaskOccurrence {
  id: string;
  taskId: string;
  recurrenceRuleId: string;
  scheduledDate: number;
  status: OccurrenceStatus;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
