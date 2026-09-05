export type ReminderType = 'exact' | 'before' | 'snoozed';

export interface Reminder {
  id: string;
  taskId: string;
  type: ReminderType;
  scheduledAt: number;
  minutesBefore: number | null;
  snoozeCount: number;
  maxSnoozes: number;
  isFired: boolean;
  createdAt: number;
  updatedAt: number;
}
