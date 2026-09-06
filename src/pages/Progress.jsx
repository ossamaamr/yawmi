// ══════════════════════════════════════════════════════════
// pages/Progress.jsx — شاشة التقدم والإحصائيات
// أسماء الأيام كاملة في مخطط آخر ٧ أيام.
// ══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import Footer from '../components/Footer';
import { toArabicNumerals, addDays } from '../lib/utils';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function Progress() {
  const { tasks, loading, getStats } = useTaskContext();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    getStats().then((s) => {
      if (!active) return;
      setStats(s);
    });
    return () => {
      active = false;
    };
  }, [tasks, getStats]);

  if (loading || !stats) {
    return (
      <div className="صفحة">
        <div className="شاشة-مركزية">
          <div className="مؤشر" />
        </div>
      </div>
    );
  }

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = addDays(Date.now(), -i);
    const key = new Date(dayStart).toISOString().slice(0, 10);
    days.push({ label: DAY_NAMES[new Date(dayStart).getDay()], count: stats.byDay[key] || 0 });
  }
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="صفحة">
      <header className="رأس-الصفحة">
        <h1>التقدم</h1>
      </header>

      <div className="شبكة-الإحصائيات">
        <div className="بطاقة-الإحصاء">
          <span className="قيمة-الإحصاء">{toArabicNumerals(stats.totalCompleted)}</span>
          <span className="تسمية-الإحصاء">إجمالي المُنجز</span>
        </div>
        <div className="بطاقة-الإحصاء">
          <span className="قيمة-الإحصاء">{toArabicNumerals(stats.completedToday)}</span>
          <span className="تسمية-الإحصاء">اليوم</span>
        </div>
        <div className="بطاقة-الإحصاء">
          <span className="قيمة-الإحصاء">{toArabicNumerals(stats.completedThisWeek)}</span>
          <span className="تسمية-الإحصاء">هذا الأسبوع</span>
        </div>
      </div>

      <div className="بطاقة بطاقة-المخطط">
        <h2>آخر ٧ أيام</h2>
        <div className="مخطط-الأعمدة">
          {days.map((d, i) => (
            <div key={i} className="عمود-المخطط">
              <span className="قيمة-العمود">{d.count > 0 ? toArabicNumerals(d.count) : ''}</span>
              <div
                className="شريط-المخطط"
                style={{ height: `${Math.max(8, (d.count / maxCount) * 80)}px`, opacity: d.count ? 1 : 0.25 }}
              />
              <span className="تسمية-العمود">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="بطاقة بطاقة-التقدم">
        <h2>المهام التدريجية</h2>
        {stats.progresses.length === 0 ? (
          <p className="نص-ناعم">لا توجد مهام تدريجية بعد.</p>
        ) : (
          <div className="عمود">
            {stats.progresses.map((p) => (
              <div key={p.id} className="صف-التقدم">
                <div className="مرن">
                  <div className="صف-بين">
                    <strong>{p.taskTitle}</strong>
                    <span className="نص-ناعم">
                      {p.currentCursor} ← {p.target || toArabicNumerals(p.totalAmount)}
                    </span>
                  </div>
                  <div className="مسار-التقدم">
                    <div
                      className="حشو-التقدم"
                      style={{ width: `${Math.min(100, (p.completedAmount / p.totalAmount) * 100)}%` }}
                    />
                  </div>
                  <div className="صف-بين نص-ناعم">
                    <span>{p.status === 'completed' ? '✓ مكتمل' : `انتهى ${toArabicNumerals(p.completedAmount)} من ${toArabicNumerals(p.totalAmount)}`}</span>
                    <span>{p.status === 'completed' ? 'عظيم! 🎉' : 'واصل!'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}