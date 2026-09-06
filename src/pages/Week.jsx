// ══════════════════════════════════════════════════════════
// pages/Week.jsx — شاشة الأسبوع (7 أيام)
// ══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import TaskList from '../components/TaskList';
import Footer from '../components/Footer';
import { getWeekStart, getArabicDayName, toArabicNumerals, isToday } from '../lib/utils';

const DAY_LABELS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

export default function Week() {
  const { tasks, loading, getTasksForRange, completeTask } = useTaskContext();
  const [weekTasks, setWeekTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    let active = true;
    const weekStart = getWeekStart(Date.now());
    getTasksForRange(weekStart).then((days) => {
      if (!active) return;
      setWeekTasks(days);
      const todayIdx = days.findIndex((d) => isToday(d.dayStart));
      setSelectedDay(todayIdx >= 0 ? todayIdx : 0);
    });
    return () => {
      active = false;
    };
  }, [tasks, getTasksForRange]);

  const selected = weekTasks[selectedDay ?? 0];

  return (
    <div className="page">
      <header className="page-header">
        <h1>الأسبوع</h1>
      </header>

      <div className="week-strip" role="tablist" aria-label="أيام الأسبوع">
        {weekTasks.map((d, i) => {
          const date = new Date(d.dayStart);
          return (
            <button
              key={d.dayStart}
              type="button"
              className={`week-day ${selectedDay === i ? 'active' : ''} ${isToday(d.dayStart) ? 'is-today' : ''}`}
              onClick={() => setSelectedDay(i)}
              role="tab"
              aria-selected={selectedDay === i}
            >
              <span className="week-day-name">{DAY_LABELS[date.getDay()]}</span>
              <span className="week-day-num">{toArabicNumerals(date.getDate())}</span>
              {d.items.filter((x) => !x.completed).length > 0 && (
                <span className="week-day-count">{toArabicNumerals(d.items.filter((x) => !x.completed).length)}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="center-screen" style={{ minHeight: '30vh' }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && selected && (
        <TaskList
          sections={[
            {
              key: selected.dayStart,
              label: `${getArabicDayName(new Date(selected.dayStart).getDay())} ${toArabicNumerals(new Date(selected.dayStart).getDate())}`,
              items: selected.items,
            },
          ]}
          onToggle={completeTask}
          emptyTitle="لا توجد مهام في هذا اليوم"
          emptyHint="اختر يومًا آخر أو أضف مهمة جديدة"
        />
      )}

      <Footer />
    </div>
  );
}