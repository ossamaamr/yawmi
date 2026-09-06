// ══════════════════════════════════════════════════════════
// pages/RecurringTasks.jsx — صفحة المهام المتكررة
// تعرض كل المهام المتكررة، وتتيح للنقر على مهمة لرؤية:
//   - تفاصيلها وتاريخ بدايتها
//   - الأيام التي لم تُنجز فيها (أيام فائتة)
//   - زر "الاستمرار" (إعادة تفعيلها من اليوم) أو "تعديل" قاعدتها
// كل البيانات محلية في IndexedDB.
// ══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { useTaskContext } from '../context/TaskContext';
import { getRecurrenceRule, setRecurrenceRule } from '../lib/db';
import { getOccurrencesInRange } from '../lib/recurrence';
import {
  formatArabicDateShort,
  toArabicNumerals,
  startOfDay,
} from '../lib/utils';

export default function RecurringTasks() {
  const { tasks, loading, getCompletionEventsForTask } = useTaskContext();
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({});
  const [message, setMessage] = useState('');
  const [resuming, setResuming] = useState(false);

  const recurring = tasks.filter((t) => t.isRecurring && t.status === 'active');

  const loadDetails = useCallback(
    async (task) => {
      const rule = await getRecurrenceRule(task.id);
      const events = await getCompletionEventsForTask(task.id);
      const occurrences = rule
        ? getOccurrencesInRange(rule, rule.startDate, startOfDay(Date.now()))
        : [];
      const completedSet = new Set(events.map((e) => e.date));
      const missed = occurrences.filter((d) => !completedSet.has(d));
      return { rule, missed, today: startOfDay(Date.now()) };
    },
    [getCompletionEventsForTask]
  );

  useEffect(() => {
    let active = true;
    if (openId) {
      const task = tasks.find((t) => t.id === openId);
      if (!task) return undefined;
      loadDetails(task).then((d) => {
        if (!active) return;
        setDetails((prev) => ({ ...prev, [openId]: d }));
      });
    }
    return () => {
      active = false;
    };
  }, [openId, tasks, loadDetails]);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const resumeTask = async (task) => {
    const rule = await getRecurrenceRule(task.id);
    if (!rule) {
      flash('لا توجد قاعدة تكرار لهذه المهمة.');
      return;
    }
    setResuming(true);
    try {
      await setRecurrenceRule({ ...rule, startDate: startOfDay(Date.now()), updatedAt: Date.now() });
      const d = await loadDetails(task);
      setDetails((prev) => ({ ...prev, [task.id]: d }));
      flash('تمت إعادة تفعيل المهمة من اليوم.');
    } finally {
      setResuming(false);
    }
  };

  return (
    <div className="صفحة">
      <header className="رأس-الصفحة">
        <h1>المهام المتكررة</h1>
      </header>

      {message && <div className="تنبيه تنبيه-نجاح">{message}</div>}

      {loading && (
        <div className="شاشة-مركزية" style={{ minHeight: '30vh' }}>
          <div className="مؤشر" />
        </div>
      )}

      {!loading && recurring.length === 0 && (
        <div className="فارغ">
          <div className="أيقونة-فارغ">🔁</div>
          <h3>لا توجد مهام متكررة</h3>
          <p>أضف مهمة متكررة من شاشة «مهمة جديدة» وستظهر هنا.</p>
        </div>
      )}

      <div className="قائمة-المهام">
        {recurring.map((task) => {
          const isOpen = openId === task.id;
          const detail = details[task.id];
          const rule = detail?.rule;

          return (
            <div key={task.id} className={`بطاقة-المهمة بطاقة-متكررة ${isOpen ? 'مفتوحة' : ''}`}>
              <button type="button" className="رأس-المتكررة" onClick={() => toggle(task.id)}>
                <span className="عنوان-المهمة">{task.title}</span>
                <span className="وسم-التكرار">🔁 متكرر</span>
              </button>

              {isOpen && (
                <div className="تفاصيل-المتكررة">
                  {rule && (
                    <p className="نص-ناعم">
                      القاعدة: {rule.type === 'daily' && `يومي (كل ${toArabicNumerals(rule.interval)} يوم)`}
                      {rule.type === 'weekly' && `أسبوعي — كل ${toArabicNumerals(rule.interval)} أسبوع`}
                      {rule.type === 'specific_days' && 'أيام محددة من الأسبوع'}
                      {rule.type === 'monthly' && 'شهري'}
                      {rule.type === 'yearly' && 'سنوي'}
                      {rule.type === 'interval_days' && `كل ${toArabicNumerals(rule.interval)} أيام`}
                    </p>
                  )}
                  {rule && (
                    <p className="نص-ناعم">
                      تبدأ من: {formatArabicDateShort(rule.startDate)}
                    </p>
                  )}

                  <div className="حقل">
                    <label>الأيام الفائتة</label>
                    {detail && detail.missed.length > 0 ? (
                      <div className="قائمة-أيام-فائتة">
                        {detail.missed.map((d) => (
                          <span key={d} className="يوم-فائت">{formatArabicDateShort(d)}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="نص-ناعم">لا توجد أيام فائتة بعد — كل الالتزامات قائمة. ✨</p>
                    )}
                  </div>

                  <div className="صف التفاصيل-أزرار">
                    <button
                      type="button"
                      className="زر زر-مميز"
                      disabled={resuming}
                      onClick={() => resumeTask(task)}
                    >
                      استمرار من اليوم
                    </button>
                    <Link to={`/task/${task.id}/edit`} className="زر زر-شفاف">
                      تعديل
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Footer />
    </div>
  );
}