// ══════════════════════════════════════════════════════════
// pages/Today.jsx — شاشة اليوم (الرئيسية)
// ══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useSettingsContext } from '../context/SettingsContext';
import QuickAddBar from '../components/QuickAddBar';
import TaskList from '../components/TaskList';
import Footer from '../components/Footer';
import { formatArabicDate } from '../lib/utils';
import { toArabicNumerals } from '../lib/utils';

export default function Today() {
  const { tasks, loading, getTasksForDate, completeTask } = useTaskContext();
  const { notificationsEnabled, notificationsSupportedFlag, enableNotifications } = useSettingsContext();
  const [items, setItems] = useState([]);
  const [loadedDay, setLoadedDay] = useState(null);

  useEffect(() => {
    let active = true;
    getTasksForDate(Date.now()).then((result) => {
      if (!active) return;
      setItems(result);
      setLoadedDay(Date.now());
    });
    return () => {
      active = false;
    };
  }, [tasks, getTasksForDate]);

  const pendingCount = items.filter((i) => !i.completed).length;
  const doneCount = items.filter((i) => i.completed).length;

  return (
    <div className="page">
      <header className="page-header today-header">
        <div>
          <h1>يومي</h1>
          <p className="today-date">{formatArabicDate(loadedDay ?? Date.now())}</p>
        </div>
        {pendingCount > 0 && (
          <span className="seek-ring" title="المتبقي اليوم">
            <span>{toArabicNumerals(pendingCount)}</span>
          </span>
        )}
      </header>

      {!notificationsEnabled && notificationsSupportedFlag && (
        <div className="alert alert-info">
          <div className="grow">فعّل الإشعارات ليصلك تذكير بمهامك في موعدها (يعمل دون إنترنت).</div>
          <button type="button" className="btn btn-sm" onClick={enableNotifications}>
            تفعيل
          </button>
        </div>
      )}

      <QuickAddBar />

      {loading && (
        <div className="center-screen" style={{ minHeight: '30vh' }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && (
        <TaskList
          sections={[{ key: 'today', label: 'مهام اليوم', items }]}
          onToggle={completeTask}
          emptyTitle="لا توجد مهام اليوم"
          emptyHint="اضغط على + أو اكتب في الشريط السريع لإضافة مهمة"
        />
      )}

      {doneCount > 0 && pendingCount === 0 && (
        <p className="all-done text-center">أنجزتِ كل مهامك اليوم! 🎉</p>
      )}

      <Footer />
    </div>
  );
}