import { startOfDay as realStartOfDay } from '../../src/utils/date';
import * as schema from '../../src/db/schema';
import type { TaskRecord } from '../../src/features/tasks/application/task.repository';

const SEPT_4_2026 = new Date(2026, 8, 4).getTime();
const SEPT_5_2026 = SEPT_4_2026 + 86_400_000;

const TABLE_MAP = new Map<object, string>([
  [schema.tasks, 'tasks'],
  [schema.recurrenceRules, 'recurrence_rules'],
  [schema.taskOccurrences, 'task_occurrences'],
  [schema.completionEvents, 'completion_events'],
  [schema.progressionState, 'progression_state'],
  [schema.progressionEvents, 'progression_events'],
  [schema.reminders, 'reminders'],
  [schema.categories, 'categories'],
  [schema.subjects, 'subjects'],
  [schema.projects, 'projects'],
  [schema.settings, 'settings'],
  [schema.templates, 'templates'],
  [schema.routineItems, 'routine_items'],
]);

function getTableName(table: unknown): string {
  return TABLE_MAP.get(table as object) ?? 'unknown';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockDb = any;

function createSharedStore(): Record<string, unknown[]> {
  return {
    tasks: [],
    recurrence_rules: [],
    task_occurrences: [],
    completion_events: [],
    progression_state: [],
    progression_events: [],
    reminders: [],
    categories: [],
    subjects: [],
    projects: [],
    settings: [],
    templates: [],
    routine_items: [],
  };
}

function buildMockDb(store: Record<string, unknown[]>): MockDb {
  function chain(tableName: string) {
    let _filter: ((row: Record<string, unknown>) => boolean) | null = null;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where(condition: any) {
        if (typeof condition === 'function') {
          _filter = condition as (row: Record<string, unknown>) => boolean;
        }
        return this;
      },
      get() {
        const rows = store[tableName] ?? [];
        if (_filter) {
          return rows.find((r) => _filter!(r as Record<string, unknown>));
        }
        return rows[0];
      },
      all() {
        const rows = store[tableName] ?? [];
        if (_filter) {
          return rows.filter((r) => _filter!(r as Record<string, unknown>));
        }
        return [...rows];
      },
    };
  }

  return {
    _store: store,
    select() {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        from(table: any) {
          return chain(getTableName(table));
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    insert(table: any) {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        values(row: any) {
          const tableName = getTableName(table);
          (store[tableName] ??= []).push(row);
          return { returning: () => [row] };
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(table: any) {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(data: any) {
          return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            where(_condition: any) {
              const tableName = getTableName(table);
              const rows = store[tableName] ?? [];
              for (const row of rows) {
                Object.assign(row as object, data);
              }
            },
          };
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: async (fn: (tx: MockDb) => Promise<any>) => {
      const txDb = buildMockDb(store);
      return fn(txDb);
    },
  };
}

let originalDateNow: () => number;

beforeEach(() => {
  originalDateNow = Date.now;
  Date.now = () => SEPT_4_2026;
});

afterEach(() => {
  Date.now = originalDateNow;
  jest.resetModules();
});

describe('Task Flow Integration', () => {
  test('create recurring task → appear in today → complete → reappear next day', async () => {
    const sharedStore = createSharedStore();
    const mockDb = buildMockDb(sharedStore);

    jest.doMock('../../src/db/client', () => ({
      getDatabase: jest.fn().mockResolvedValue(mockDb),
    }));

    const { createTask, getTodayItems, completeTask } = await import('../../src/features/tasks/application/task.repository');

    // 1. Create a daily recurring task
    const task = await createTask({
      title: 'مراجعة الفيزياء',
      isRecurring: 1,
      dueDate: realStartOfDay(SEPT_4_2026),
    });

    // 2. Mock date = 2026-09-04
    Date.now = () => SEPT_4_2026;

    // 3. getTodayItems should contain the task
    const todayItems = await getTodayItems();
    expect(todayItems.some((t: TaskRecord) => t.id === task.id)).toBe(true);

    // 4. Complete the task
    const completed = await completeTask(task.id);
    expect(completed).toBeDefined();

    // 5. Verify streak incremented (completion event created)
    const completions = (sharedStore['completion_events'] ?? []) as Array<Record<string, unknown>>;
    const taskCompletion = completions.find((c) => c['taskId'] === task.id);
    expect(taskCompletion).toBeDefined();

    // 6. Mock date = 2026-09-05
    Date.now = () => SEPT_5_2026;

    // 7. getTodayItems should show the task again (daily recurring)
    const nextDayItems = await getTodayItems();
    expect(nextDayItems.some((t: TaskRecord) => t.id === task.id)).toBe(true);
    expect(nextDayItems.some((t: TaskRecord) => t.id === task.id && t.status === 'active')).toBe(true);
  });
});
