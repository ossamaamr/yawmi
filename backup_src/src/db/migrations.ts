import * as SQLite from 'expo-sqlite';
import { DB_NAME } from './client';

const TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT,
    project_id TEXT,
    subject_id TEXT,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    is_recurring INTEGER DEFAULT 0,
    is_progressive INTEGER DEFAULT 0,
    is_routine INTEGER DEFAULT 0,
    due_date INTEGER,
    due_time TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS recurrence_rules (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    type TEXT NOT NULL,
    interval INTEGER DEFAULT 1,
    days_of_week TEXT,
    start_date INTEGER NOT NULL,
    end_date INTEGER,
    created_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS task_occurrences (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    due_date INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    completed_at INTEGER,
    created_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS completion_events (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    occurrence_id TEXT,
    completed_at INTEGER NOT NULL,
    source TEXT DEFAULT 'manual'
  );`,

  `CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    type TEXT NOT NULL,
    minutes_before INTEGER,
    scheduled_time INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    snoozed_until INTEGER,
    notification_id TEXT,
    created_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT,
    category_id TEXT,
    created_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    created_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS progression_state (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    current_cursor TEXT NOT NULL,
    target TEXT NOT NULL,
    completed_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    status TEXT DEFAULT 'in_progress',
    created_at INTEGER,
    updated_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS progression_events (
    id TEXT PRIMARY KEY,
    progression_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    cursor_value TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    task_data TEXT NOT NULL,
    recurrence_data TEXT,
    created_at INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS routine_items (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    created_at INTEGER
  );`,
];

const INDEXES_SQL = [
  `CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date ON tasks(status, due_date);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);`,

  `CREATE INDEX IF NOT EXISTS idx_recurrence_rules_task ON recurrence_rules(task_id);`,

  `CREATE INDEX IF NOT EXISTS idx_task_occurrences_task ON task_occurrences(task_id);`,
  `CREATE INDEX IF NOT EXISTS idx_task_occurrences_due_date ON task_occurrences(due_date);`,
  `CREATE INDEX IF NOT EXISTS idx_task_occurrences_status ON task_occurrences(status);`,

  `CREATE INDEX IF NOT EXISTS idx_completion_events_task ON completion_events(task_id);`,
  `CREATE INDEX IF NOT EXISTS idx_completion_events_occurrence ON completion_events(occurrence_id);`,

  `CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(task_id);`,
  `CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_time);`,
  `CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active);`,

  `CREATE INDEX IF NOT EXISTS idx_subjects_category ON subjects(category_id);`,

  `CREATE INDEX IF NOT EXISTS idx_progression_state_task ON progression_state(task_id);`,
  `CREATE INDEX IF NOT EXISTS idx_progression_events_progression ON progression_events(progression_id);`,

  `CREATE INDEX IF NOT EXISTS idx_routine_items_routine ON routine_items(routine_id);`,
];

export async function runMigrations() {
  const sqlite = await SQLite.openDatabaseAsync(DB_NAME);

  for (const sql of TABLES_SQL) {
    await sqlite.execAsync(sql);
  }

  for (const sql of INDEXES_SQL) {
    await sqlite.execAsync(sql);
  }

  await sqlite.closeAsync();
}
