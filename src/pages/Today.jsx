// ══════════════════════════════════════════════════════════
// pages/Today.jsx — شاشة اليوم (الرئيسية)
// تعرض الحماسة القرآنيّة أعلى الصفحة، وتنبيه الإشعارات مع رابط
// لإعدادات النظام عند رفض الإذن.
// ══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';
import { useSettingsContext } from '../context/SettingsContext';
import QuickAddBar from '../components/QuickAddBar';
import TaskList from '../components/TaskList';
import Footer from '../components/Footer';
import { toArabicNumerals } from '../lib/utils';

export default function Today() {
  const { tasks, loading, getTasksForDate, completeTask } = useTaskContext();
  const {
    notificationsEnabled,
    notificationsSupportedFlag,
    enableNotifications,
    goToNotificationSettings,
    quranStreak,
  } = useSettingsContext();
  const [items, setItems] = useState([]);
  const [permDenied, setPermDenied] = useState(false);

  useEffect(() => {
    let active = true;
    getTasksForDate(Date.now()).then((result) => {
      if (!active) return;
      setItems(result);
    });
    return () => {
      active = false;
    };
  }, [tasks, getTasksForDate]);

  const handleEnable = async () => {
    const granted = await enableNotifications();
    if (!granted) setPermDenied(true);
  };

  const pendingCount = items.filter((i) => !i.completed).length;
  const doneCount = items.filter((i) => i.completed).length;

  return (
    <div className="صفحة">
      <header className="رأس-الصفحة رأس-اليوم">
        <h1>يومي</h1>
        {pendingCount > 0 && (
          <span className="حلقة-الإنجاز" title="المتبقي اليوم">
            {toArabicNumerals(pendingCount)}
          </span>
        )}
      </header>

      {quranStreak > 0 && (
        <Link to="/quran" className="بطاقة وسم-الحماسة-بطاقة">
          🔥 حماسك القرآني: {toArabicNumerals(quranStreak)}{' '}
          {quranStreak === 1 ? 'يوم' : quranStreak === 2 ? 'يومان' : 'أيام'} متتالية
        </Link>
      )}

      {!notificationsEnabled && notificationsSupportedFlag && !permDenied && (
        <div className="تنبيه تنبيه-معلومات">
          <div className="مرن">فعّل الإشعارات ليصلك تذكير بمهامك في موعدها (يعمل دون إنترنت).</div>
          <button type="button" className="زر زر-صغير" onClick={handleEnable}>
            تفعيل
          </button>
        </div>
      )}

      {permDenied && (
        <div className="تنبيه تنبيه-تحذير">
          <div className="مرن">رُفض إذن الإشعارات — فعّله من إعدادات النظام مباشرة.</div>
          <button type="button" className="زر زر-صغير" onClick={goToNotificationSettings}>
            فتح الإعدادات
          </button>
        </div>
      )}

      <QuickAddBar />

      {loading && (
        <div className="شاشة-مركزية" style={{ minHeight: '30vh' }}>
          <div className="مؤشر" />
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
        <p className="كل-منجز نص-مركز">أنجزتِ كل مهامك اليوم! 🎉</p>
      )}

      <Footer />
    </div>
  );
}