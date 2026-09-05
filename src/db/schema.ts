import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  categoryId: text('category_id'),
  projectId: text('project_id'),
  subjectId: text('subject_id'),
  priority: integer('priority').default(0),
  status: text('status').default('active'),
  isRecurring: integer('is_recurring').default(0),
  isProgressive: integer('is_progressive').default(0),
  isRoutine: integer('is_routine').default(0),
  dueDate: integer('due_date'),
  dueTime: text('due_time'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const recurrenceRules = sqliteTable('recurrence_rules', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  type: text('type').notNull(),
  interval: integer('interval').default(1),
  daysOfWeek: text('days_of_week'),
  startDate: integer('start_date').notNull(),
  endDate: integer('end_date'),
  createdAt: integer('created_at'),
});

export const taskOccurrences = sqliteTable('task_occurrences', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  dueDate: integer('due_date').notNull(),
  status: text('status').default('pending'),
  completedAt: integer('completed_at'),
  createdAt: integer('created_at'),
});

export const completionEvents = sqliteTable('completion_events', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  occurrenceId: text('occurrence_id'),
  completedAt: integer('completed_at').notNull(),
  source: text('source').default('manual'),
});

export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  type: text('type').notNull(),
  minutesBefore: integer('minutes_before'),
  scheduledTime: integer('scheduled_time').notNull(),
  isActive: integer('is_active').default(1),
  snoozedUntil: integer('snoozed_until'),
  notificationId: text('notification_id'),
  createdAt: integer('created_at'),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at'),
});

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  grade: text('grade'),
  categoryId: text('category_id'),
  createdAt: integer('created_at'),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  createdAt: integer('created_at'),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at'),
});

export const progressionState = sqliteTable('progression_state', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  currentCursor: text('current_cursor').notNull(),
  target: text('target').notNull(),
  completedAmount: integer('completed_amount').default(0),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').default('in_progress'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const progressionEvents = sqliteTable('progression_events', {
  id: text('id').primaryKey(),
  progressionId: text('progression_id').notNull(),
  eventType: text('event_type').notNull(),
  cursorValue: text('cursor_value').notNull(),
  timestamp: integer('timestamp').notNull(),
});

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  taskData: text('task_data').notNull(),
  recurrenceData: text('recurrence_data'),
  createdAt: integer('created_at'),
});

export const routineItems = sqliteTable('routine_items', {
  id: text('id').primaryKey(),
  routineId: text('routine_id').notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').default(0),
  isCompleted: integer('is_completed').default(0),
  createdAt: integer('created_at'),
});

export const idxTasksCategory = index('idx_tasks_category').on(tasks.categoryId);
export const idxTasksProject = index('idx_tasks_project').on(tasks.projectId);
export const idxTasksSubject = index('idx_tasks_subject').on(tasks.subjectId);
export const idxTasksStatus = index('idx_tasks_status').on(tasks.status);
export const idxTasksDueDate = index('idx_tasks_due_date').on(tasks.dueDate);
export const idxTasksPriority = index('idx_tasks_priority').on(tasks.priority);
export const idxTasksStatusDueDate = index('idx_tasks_status_due_date').on(
  tasks.status,
  tasks.dueDate
);

export const idxRecurrenceRulesTask = index('idx_recurrence_rules_task').on(
  recurrenceRules.taskId
);

export const idxTaskOccurrencesTask = index('idx_task_occurrences_task').on(
  taskOccurrences.taskId
);
export const idxTaskOccurrencesDueDate = index('idx_task_occurrences_due_date').on(
  taskOccurrences.dueDate
);
export const idxTaskOccurrencesStatus = index('idx_task_occurrences_status').on(
  taskOccurrences.status
);

export const idxCompletionEventsTask = index('idx_completion_events_task').on(
  completionEvents.taskId
);
export const idxCompletionEventsOccurrence = index('idx_completion_events_occurrence').on(
  completionEvents.occurrenceId
);

export const idxRemindersTask = index('idx_reminders_task').on(reminders.taskId);
export const idxRemindersScheduled = index('idx_reminders_scheduled').on(
  reminders.scheduledTime
);
export const idxRemindersActive = index('idx_reminders_active').on(reminders.isActive);

export const idxSubjectsCategory = index('idx_subjects_category').on(subjects.categoryId);

export const idxProgressionStateTask = index('idx_progression_state_task').on(
  progressionState.taskId
);
export const idxProgressionEventsProgression = index(
  'idx_progression_events_progression'
).on(progressionEvents.progressionId);

export const idxRoutineItemsRoutine = index('idx_routine_items_routine').on(
  routineItems.routineId
);
