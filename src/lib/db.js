// ══════════════════════════════════════════════════════════
// lib/db.js — فتح/تهيئة IndexedDB
// مخطط: Task (tasks) + Recurrence (recurrence_rules) + Progression (progression_state/events)
// بيانات المستخدم محلية بالكامل على جهازه فقط.
// ══════════════════════════════════════════════════════════
import { openDB } from 'idb';

const DB_NAME = 'yawmi';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          const store = db.createObjectStore('tasks', { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('dueDate', 'dueDate');
        }
        if (!db.objectStoreNames.contains('recurrence_rules')) {
          const store = db.createObjectStore('recurrence_rules', { keyPath: 'id' });
          store.createIndex('taskId', 'taskId');
        }
        if (!db.objectStoreNames.contains('progression_state')) {
          const store = db.createObjectStore('progression_state', { keyPath: 'id' });
          store.createIndex('taskId', 'taskId');
        }
        if (!db.objectStoreNames.contains('progression_events')) {
          db.createObjectStore('progression_events', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('completion_events')) {
          const store = db.createObjectStore('completion_events', { keyPath: 'id', autoIncrement: true });
          store.createIndex('taskId', 'taskId');
          store.createIndex('date', 'date');
          store.createIndex('taskDate', ['taskId', 'date']);
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export function uid(prefix = 't') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── المهام (Tasks) ──
export async function addTask(task) {
  const db = await getDB();
  await db.put('tasks', task);
  return task;
}

export async function getTask(id) {
  const db = await getDB();
  return db.get('tasks', id);
}

export async function getAllTasks() {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function updateTask(id, patch) {
  const db = await getDB();
  const existing = await db.get('tasks', id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: Date.now() };
  await db.put('tasks', updated);
  return updated;
}

export async function hardDeleteTask(id) {
  const db = await getDB();
  await db.delete('tasks', id);
}

// ── قواعد التكرار (Recurrence) ──
export async function setRecurrenceRule(rule) {
  const db = await getDB();
  await db.put('recurrence_rules', rule);
  return rule;
}

export async function getRecurrenceRule(taskId) {
  const db = await getDB();
  const all = await db.getAll('recurrence_rules');
  return all.find((r) => r.taskId === taskId) || null;
}

export async function getAllRecurrenceRules() {
  const db = await getDB();
  return db.getAll('recurrence_rules');
}

export async function deleteRecurrenceRuleByTask(taskId) {
  const db = await getDB();
  const rule = await getRecurrenceRule(taskId);
  if (rule) await db.delete('recurrence_rules', rule.id);
}

// ── التقدم (Progression) ──
export async function setProgressionState(state) {
  const db = await getDB();
  await db.put('progression_state', state);
  return state;
}

export async function getProgressionState(taskId) {
  const db = await getDB();
  const all = await db.getAll('progression_state');
  return all.find((s) => s.taskId === taskId) || null;
}

export async function getAllProgressionStates() {
  const db = await getDB();
  return db.getAll('progression_state');
}

export async function deleteProgressionByTask(taskId) {
  const db = await getDB();
  const state = await getProgressionState(taskId);
  if (state) {
    await db.delete('progression_state', state.id);
    const events = await db.getAll('progression_events');
    for (const ev of events) {
      if (ev.progressionId === state.id) await db.delete('progression_events', ev.id);
    }
  }
}

export async function addProgressionEvent(event) {
  const db = await getDB();
  await db.add('progression_events', event);
}

export async function hasProgressionAdvance(progressionId, cursorValue) {
  const db = await getDB();
  const events = await db.getAll('progression_events');
  return events.some(
    (e) => e.progressionId === progressionId && e.cursorValue === cursorValue
  );
}

// ── أحداث الإنجاز (Completion) ──
export async function addCompletionEvent(event) {
  const db = await getDB();
  await db.add('completion_events', event);
}

export async function getCompletionEvent(taskId, date) {
  const db = await getDB();
  const events = await db.getAll('completion_events');
  return events.find((e) => e.taskId === taskId && e.date === date) || null;
}

export async function getCompletionEventsForTask(taskId) {
  const db = await getDB();
  return db.getAll('completion_events').then((all) => all.filter((e) => e.taskId === taskId));
}

export async function getAllCompletionEvents() {
  const db = await getDB();
  return db.getAll('completion_events');
}

export async function removeCompletionEvent(id) {
  const db = await getDB();
  await db.delete('completion_events', id);
}

// ── الإعدادات ──
export async function getSetting(key, fallback = null) {
  const db = await getDB();
  const value = await db.get('settings', key);
  return value === undefined ? fallback : value;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', value, key);
}

// ── تصدير/استيراد/إعادة تعيين ──
export async function exportAllData() {
  const db = await getDB();
  const data = {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: await db.getAll('tasks'),
    recurrence_rules: await db.getAll('recurrence_rules'),
    progression_state: await db.getAll('progression_state'),
    progression_events: await db.getAll('progression_events'),
    completion_events: await db.getAll('completion_events'),
    settings: await db.getAll('settings'),
  };
  return data;
}

export async function importAllData(data) {
  if (!data || !Array.isArray(data.tasks)) return false;
  const db = await getDB();
  const tx = db.transaction(
    ['tasks', 'recurrence_rules', 'progression_state', 'completion_events', 'settings'],
    'readwrite'
  );
  for (const store of ['tasks', 'recurrence_rules', 'progression_state', 'completion_events']) {
    if (Array.isArray(data[store])) {
      for (const row of data[store]) await tx.objectStore(store).put(row);
    }
  }
  if (data.settings && typeof data.settings === 'object') {
    for (const [key, value] of Object.entries(data.settings)) {
      await tx.objectStore('settings').put(value, key);
    }
  }
  await tx.done;
  return true;
}

export async function clearAllData() {
  const db = await getDB();
  const tx = db.transaction(
    ['tasks', 'recurrence_rules', 'progression_state', 'progression_events', 'completion_events', 'settings'],
    'readwrite'
  );
  for (const store of ['tasks', 'recurrence_rules', 'progression_state', 'progression_events', 'completion_events', 'settings']) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
}