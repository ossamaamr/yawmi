// ══════════════════════════════════════════════════════════
// pages/Progress.jsx — شاشة التقدم والإحصائيات
// ══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import Footer from '../components/Footer';
import { toArabicNumerals, addDays } from '../lib/utils';

const DAY_NAMES = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

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
      <div className="page">
        <div className="center-screen">
          <div className="spinner" />
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
    <div className="page">
      <header className="page-header">
        <h1>التقدم</h1>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{toArabicNumerals(stats.totalCompleted)}</span>
          <span className="stat-label">إجمالي المُنجز</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{toArabicNumerals(stats.completedToday)}</span>
          <span className="stat-label">اليوم</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{toArabicNumerals(stats.completedThisWeek)}</span>
          <span className="stat-label">هذا الأسبوع</span>
        </div>
      </div>

      <div className="card chart-card">
        <h2>آخر ٧ أيام</h2>
        <div className="bar-chart">
          {days.map((d, i) => (
            <div key={i} className="bar-col">
              <span className="bar-value">{d.count > 0 ? toArabicNumerals(d.count) : ''}</span>
              <div
                className="bar"
                style={{ height: `${Math.max(8, (d.count / maxCount) * 80)}px`, opacity: d.count ? 1 : 0.25 }}
              />
              <span className="bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card progression-card">
        <h2>المهام التدريجية</h2>
        {stats.progresses.length === 0 ? (
          <p className="text-soft">لا توجد مهام تدريجية بعد.</p>
        ) : (
          <div className="stack">
            {stats.progresses.map((p) => (
              <div key={p.id} className="progression-row">
                <div className="grow">
                  <div className="row-between">
                    <strong>{p.taskTitle}</strong>
                    <span className="text-soft">
                      {p.currentCursor} ← {p.target || toArabicNumerals(p.totalAmount)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, (p.completedAmount / p.totalAmount) * 100)}%` }}
                    />
                  </div>
                  <div className="row-between text-soft">
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