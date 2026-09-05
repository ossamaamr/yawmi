import { Reminder, ReminderType } from './reminder.types';

interface ReminderConfig {
  type: ReminderType;
  minutesBefore?: number;
}

export function calculateReminderTime(
  taskDueTime: string,
  reminderConfig: ReminderConfig,
): number {
  const parts = taskDueTime.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const dueMs = (hours * 60 + minutes) * 60 * 1000;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueTimestamp = today.getTime() + dueMs;

  switch (reminderConfig.type) {
    case 'exact':
      return dueTimestamp;

    case 'before': {
      const offset = (reminderConfig.minutesBefore ?? 0) * 60 * 1000;
      return dueTimestamp - offset;
    }

    case 'snoozed': {
      const snoozeOffset = (reminderConfig.minutesBefore ?? 5) * 60 * 1000;
      return Date.now() + snoozeOffset;
    }

    default:
      return dueTimestamp;
  }
}

export function shouldShowReminder(reminder: Reminder, now: number): boolean {
  if (reminder.isFired) return false;
  if (reminder.snoozeCount >= reminder.maxSnoozes) return false;
  return now >= reminder.scheduledAt;
}
