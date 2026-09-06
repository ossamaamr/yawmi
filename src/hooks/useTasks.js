// ══════════════════════════════════════════════════════════
// hooks/useTasks.js — دوال جلب وتحديث المهام من IndexedDB
// يجمع: التخزين (db) + التكرار (recurrence) + التقدم (progression) + الإشعارات
// ══════════════════════════════════════════════════════════
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getAllTasks,
  addTask as dbAddTask,
  updateTask,
  hardDeleteTask,
  getAllRecurrenceRules,
  getRecurrenceRule,
  setRecurrenceRule,
  deleteRecurrenceRuleByTask,
  getProgressionState,
  setProgressionState,
  deleteProgressionByTask,
  addCompletionEvent,
  getCompletionEvent,
  getCompletionEventsForTask,
  getAllCompletionEvents,
  removeCompletionEvent,
  getAllProgressionStates,
  uid,
} from '../lib/db';
import {
  getPreviousCursor,
  advanceProgression,
  createProgressionForTask,
} from '../lib/progression';
import { taskIsDueOnDate, getNextOccurrenceDate } from '../lib/recurrence';
import {
  scheduleNotification,
  cancelNotification,
  taskFireTime,
} from '../lib/notifications';
import { startOfDay, endOfDay, formatArabicTime } from '../lib/utils';

// id رقمي ثابت للمهمة لاستخدامه في الإشعارات
function numericId(taskId) {
  const digits = taskId.replace(/\D/g, '');
  return digits ? (parseInt(digits.slice(-8), 10) % 2000000000) || 1001 : 1001;
}

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const reload = useCallback(async () => {
    setLoading(!loadedRef.current);
    const all = await getAllTasks();
    setTasks(all.filter((t) => t.status !== 'deleted'));
    loadedRef.current = true;
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── جلب المهام المستحقة في يوم محدد ──
  const getTasksForDate = useCallback(
    async (date) => {
      const todayStart = startOfDay(date);
      const todayEnd = endOfDay(date);
      const rules = await getAllRecurrenceRules();
      const events = await getAllCompletionEvents();

      const doneFor = (taskId) => events.find((e) => e.taskId === taskId && e.date === todayStart) || null;

      const result = [];
      for (const task of tasks) {
        if (task.status !== 'active') continue;

        // مهمة مباشرة في هذا اليوم
        if (task.dueDate >= todayStart && task.dueDate <= todayEnd && !task.isRecurring && !task.isProgressive) {
          const done = doneFor(task.id);
          result.push({ task, date: todayStart, completed: !!done, completionId: done?.id });
          continue;
        }

        // مهمة متكررة
        if (task.isRecurring) {
          const rule = rules.find((r) => r.taskId === task.id);
          if (rule && taskIsDueOnDate(task, rule, todayStart)) {
            const done = doneFor(task.id);
            result.push({ task, date: todayStart, completed: !!done, completionId: done?.id });
          }
        }
      }

      // المهام التدريجية تظهر في شاشة اليوم فقط
      if (todayStart === startOfDay(Date.now())) {
        for (const task of tasks) {
          if (task.status !== 'active' || !task.isProgressive) continue;
          if (!result.find((r) => r.task.id === task.id)) {
            const state = await getProgressionState(task.id);
            result.push({ task, date: todayStart, completed: false, progression: state });
          }
        }
      }

      result.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const p = { none: 0, low: 1, medium: 2, high: 3 };
        return (p[b.task.priority ?? 'none'] ?? 0) - (p[a.task.priority ?? 'none'] ?? 0);
      });

      return result;
    },
    [tasks]
  );

  const getTasksForRange = useCallback(
    async (weekStart) => {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const dayStart = startOfDay(weekStart) + i * 86_400_000;
        days.push({ dayStart, items: await getTasksForDate(dayStart) });
      }
      return days;
    },
    [getTasksForDate]
  );

  // ── إنشاء مهمة ──
  const addTask = useCallback(
    async (input) => {
      const now = Date.now();
      const taskId = uid('task');
      const task = {
        id: taskId,
        title: input.title || 'مهمة بدون عنوان',
        description: input.description || '',
        category: input.category || 'general',
        priority: input.priority || 'none',
        dueDate: input.dueDate ?? startOfDay(now),
        dueTime: input.dueTime || null,
        isAllDay: !!input.isAllDay,
        status: 'active',
        isRecurring: !!input.recurrence,
        isProgressive: !!input.progression,
        recurrenceId: null,
        progressionId: null,
        notificationId: null,
        completedAt: null,
        tags: input.tags || [],
        ringtone: input.ringtone || null,
        createdAt: now,
        updatedAt: now,
      };
      await dbAddTask(task);

      if (input.recurrence) {
        const rule = {
          id: uid('rr'),
          taskId,
          type: input.recurrence.type || 'daily',
          interval: input.recurrence.interval ?? 1,
          daysOfWeek: input.recurrence.daysOfWeek || [],
          dayOfMonth: input.recurrence.dayOfMonth ?? null,
          monthOfYear: input.recurrence.monthOfYear ?? null,
          startDate: input.recurrence.startDate ?? task.dueDate,
          endDate: input.recurrence.endDate ?? null,
          maxOccurrences: input.recurrence.maxOccurrences || null,
          createdAt: now,
          updatedAt: now,
        };
        await setRecurrenceRule(rule);
        await updateTask(taskId, { recurrenceId: rule.id });
        task.recurrenceId = rule.id;
      }

      if (input.progression) {
        const progress = createProgressionForTask(taskId, input.progression);
        await setProgressionState(progress);
        await updateTask(taskId, { progressionId: progress.id });
        task.progressionId = progress.id;
      }

      await scheduleForTask({ ...task, recurrenceId: task.recurrenceId });
      await reload();
      return task;
    },
    [reload]
  );

  // ── تعديل مهمة ──
  const editTask = useCallback(
    async (id, patch) => {
      const updated = await updateTask(id, patch);
      if (updated) {
        if (patch.dueDate !== undefined || patch.dueTime !== undefined || patch.isRecurring !== undefined || patch.recurrence !== undefined) {
          await scheduleForTask(updated);
        }
        await reload();
      }
      return updated;
    },
    [reload]
  );

  // ── إكمال / تراجع ──
  const completeTask = useCallback(
    async (id, date) => {
      const todayStart = startOfDay(date ?? Date.now());
      const task = tasks.find((t) => t.id === id) || (await getAllTasks()).find((t) => t.id === id);
      if (!task) return;

      const existing = await getCompletionEvent(id, todayStart);
      const now = Date.now();

      if (!existing) {
        await addCompletionEvent({ taskId: id, date: todayStart, taskTitle: task.title, createdAt: now });

        if (task.isProgressive) {
          const progressed = await advanceProgression(id);
          if (progressed && progressed.status === 'completed') {
            await updateTask(id, { status: 'completed', completedAt: now });
          }
        } else if (!task.isRecurring) {
          await updateTask(id, { status: 'completed', completedAt: now });
        }
      } else {
        await removeCompletionEvent(existing.id);
        if (task.isProgressive) {
          const state = await getProgressionState(id);
          if (state && state.completedAmount > 0) {
            const undoneCursor = getPreviousCursor(state.currentCursor);
            const newAmount = Math.max(0, state.completedAmount - 1);
            await setProgressionState({
              ...state,
              currentCursor: undoneCursor,
              completedAmount: newAmount,
              status: 'in_progress',
              completedAt: null,
              updatedAt: Date.now(),
            });
          }
        } else if (!task.isRecurring) {
          await updateTask(id, { status: 'active', completedAt: null });
        }
      }
      await reload();
    },
    [tasks, reload]
  );

  // ── حذف مهمة (ناعم) + تنظيف القواعد والإشعارات ──
  const removeTask = useCallback(
    async (id) => {
      const task = tasks.find((t) => t.id === id);
      if (task?.notificationId) await cancelNotification(task.notificationId);
      await deleteRecurrenceRuleByTask(id);
      await deleteProgressionByTask(id);
      await hardDeleteTask(id);
      await reload();
    },
    [tasks, reload]
  );

  // ── جدولة إشعار مهمة (الأقرب القادم) ──
  const scheduleForTask = useCallback(
    async (task) => {
      if (!task || task.status !== 'active') return;
      if (task.notificationId) await cancelNotification(task.notificationId);

      let fireAt = taskFireTime(task.dueDate, task.dueTime);

      if (task.isRecurring) {
        const rule = await getRecurrenceRule(task.id);
        if (rule) {
          const nextOcc = getNextOccurrenceDate(rule, Date.now());
          if (nextOcc > 0) {
            const withTime = taskFireTime(nextOcc, task.dueTime);
            fireAt = withTime && withTime > Date.now() ? withTime : null;
          } else {
            fireAt = null;
          }
        }
      }

      if (!fireAt) return;
      const id = numericId(task.id);
      const scheduled = await scheduleNotification({
        id,
        title: '⏰ ' + task.title,
        body: task.dueTime ? `حان موعد مهمتك ${formatArabicTime(task.dueTime)}` : 'أدّي مهمتك الآن',
        at: fireAt,
        sound: task.ringtone || undefined,
      });
      if (scheduled) await updateTask(task.id, { notificationId: id });
    },
    []
  );

  // إعادة جدولة كل الإشعارات بعد كل تغيير
  const syncNotifications = useCallback(async () => {
    const all = await getAllTasks();
    for (const task of all.filter((t) => t.status === 'active')) {
      await scheduleForTask(task);
    }
  }, [scheduleForTask]);

  // ── إحصائيات صفحة التقدم ──
  const getStats = useCallback(async () => {
    const events = await getAllCompletionEvents();
    const progresses = await getAllProgressionStates();
    const todayStart = startOfDay(Date.now());

    return {
      totalCompleted: events.length,
      completedToday: events.filter((e) => e.date === todayStart).length,
      completedThisWeek: events.filter((e) => e.date >= startOfDay(Date.now() - 6 * 86_400_000)).length,
      byDay: events.reduce((map, e) => {
        const key = new Date(e.date).toISOString().slice(0, 10);
        map[key] = (map[key] || 0) + 1;
        return map;
      }, {}),
      progresses: progresses.map((p) => {
        const task = tasks.find((t) => t.id === p.taskId);
        return { ...p, taskTitle: task?.title || 'مهمة محذوفة' };
      }),
      activeProgress: progresses.filter((p) => p.status === 'in_progress').length,
      completedProgress: progresses.filter((p) => p.status === 'completed').length,
    };
  }, [tasks]);

  return {
    tasks,
    loading,
    reload,
    getTasksForDate,
    getTasksForRange,
    addTask,
    editTask,
    completeTask,
    removeTask,
    syncNotifications,
    getStats,
    getCompletionEventsForTask,
  };
}