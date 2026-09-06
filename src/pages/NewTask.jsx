// ══════════════════════════════════════════════════════════
// pages/NewTask.jsx — إضافة / تعديل مهمة
// ══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';
import Footer from '../components/Footer';
import { startOfDay, toArabicNumerals } from '../lib/utils';

const DAY_LABELS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const REPEAT_OPTIONS = [
  { value: '', label: 'بدون تكرار' },
  { value: 'daily', label: 'يومي' },
  { value: 'weekly', label: 'أسبوعي (اختر الأيام)' },
  { value: 'specific_days', label: 'أيام محددة من الأسبوع' },
  { value: 'monthly', label: 'شهريًا' },
  { value: 'yearly', label: 'سنويًا' },
  { value: 'interval_days', label: 'كل بضعة أيام' },
];

function toDateInput(ms) {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function NewTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, addTask, editTask, loading } = useTaskContext();

  const isEdit = Boolean(id);
  const existing = isEdit ? tasks.find((t) => t.id === id) : null;

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: toDateInput(startOfDay(Date.now())),
    time: '',
    isAllDay: true,
    category: 'general',
    priority: 'none',
    repeatType: '',
    interval: 1,
    daysOfWeek: [],
    isProgressive: false,
    totalAmount: 5,
    target: '',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description,
        date: toDateInput(existing.dueDate),
        time: existing.dueTime || '',
        isAllDay: !existing.dueTime,
        category: existing.category || 'general',
        priority: existing.priority || 'none',
        repeatType: existing.isRecurring ? 'daily' : '',
        interval: 1,
        daysOfWeek: [],
        isProgressive: existing.isProgressive,
        totalAmount: existing.progressionTotal || 5,
        target: '',
      });
    }
  }, [existing]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (d) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const dueDate = startOfDay(new Date(form.date).getTime());
    const recurrence =
      form.repeatType === '' || form.repeatType === 'none'
        ? null
        : {
            type: form.repeatType,
            interval: Number(form.interval) || 1,
            daysOfWeek: form.daysOfWeek,
            startDate: dueDate,
          };

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate,
      dueTime: form.isAllDay ? null : form.time || null,
      isAllDay: form.isAllDay,
      category: form.category,
      priority: form.priority,
      recurrence,
      progression: form.isProgressive
        ? { totalAmount: Number(form.totalAmount) || 1, target: form.target || toArabicNumerals(Number(form.totalAmount) || 1), currentCursor: '0' }
        : null,
    };

    if (isEdit && existing) {
      await editTask(existing.id, {
        title: payload.title,
        description: payload.description,
        dueDate: payload.dueDate,
        dueTime: payload.dueTime,
        isAllDay: payload.isAllDay,
        category: payload.category,
        priority: payload.priority,
      });
      navigate(`/task/${existing.id}`);
    } else {
      const created = await addTask(payload);
      navigate(`/task/${created.id}`);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="center-screen">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const needsDays = form.repeatType === 'weekly' || form.repeatType === 'specific_days';

  return (
    <div className="page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="رجوع">
          →
        </button>
        <h1>{isEdit ? 'تعديل المهمة' : 'مهمة جديدة'}</h1>
      </header>

      <form className="card form-card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="task-title">عنوان المهمة</label>
          <input
            id="task-title"
            className="input"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="مثال: قراءة ٢٠ صفحة"
          />
        </div>

        <div className="field">
          <label htmlFor="task-desc">وصف (اختياري)</label>
          <textarea
            id="task-desc"
            className="textarea"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="ملاحظات إضافية…"
          />
        </div>

        <div className="field-row">
          <div className="field grow">
            <label htmlFor="task-date">التاريخ</label>
            <input
              id="task-date"
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>
          <div className="field grow">
            <label htmlFor="task-time">الوقت</label>
            <input
              id="task-time"
              className="input"
              type="time"
              value={form.time}
              disabled={form.isAllDay}
              onChange={(e) => set('time', e.target.value)}
            />
          </div>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={form.isAllDay}
            onChange={(e) => set('isAllDay', e.target.checked)}
          />
          <span>مهمة طوال اليوم (بدون وقت محدد)</span>
        </label>

        <div className="field-row">
          <div className="field grow">
            <label htmlFor="task-category">الفئة</label>
            <select id="task-category" className="select" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="general">عام</option>
              <option value="personal">شخصي</option>
              <option value="work">عمل</option>
              <option value="health">صحة</option>
              <option value="education">تعليم</option>
              <option value="home">منزل</option>
              <option value="family">عائلة</option>
              <option value="worship">عبادة</option>
            </select>
          </div>
          <div className="field grow">
            <label htmlFor="task-priority">الأولوية</label>
            <select id="task-priority" className="select" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="none">بدون</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="task-repeat">التكرار</label>
          <select id="task-repeat" className="select" value={form.repeatType} onChange={(e) => set('repeatType', e.target.value)}>
            {REPEAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {form.repeatType === 'daily' && (
          <div className="field">
            <label>التردد</label>
            <div className="chip-row">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip ${form.repeatType === 'daily' && Number(form.interval) === n ? 'active' : ''}`}
                  onClick={() => set('interval', n)}
                >
                  كل {toArabicNumerals(n)}
                  {n === 1 ? ' يوم' : ' أيام'}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsDays && (
          <div className="field">
            <label>اختر الأيام</label>
            <div className="chip-row">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`chip ${form.daysOfWeek.includes(idx) ? 'active' : ''}`}
                  onClick={() => toggleDay(idx)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.isProgressive}
              onChange={(e) => set('isProgressive', e.target.checked)}
            />
            <span>📈 مهمة تدريجية (تتقدّم بالإكمال فقط)</span>
          </label>
          {form.isProgressive && (
            <div className="field-row">
              <div className="field grow">
                <label htmlFor="task-total">إجمالي الخطوات</label>
                <input
                  id="task-total"
                  className="input"
                  type="number"
                  min="1"
                  value={form.totalAmount}
                  onChange={(e) => set('totalAmount', e.target.value)}
                />
              </div>
              <div className="field grow">
                <label htmlFor="task-target">الهدف (نص اختياري)</label>
                <input
                  id="task-target"
                  className="input"
                  value={form.target}
                  onChange={(e) => set('target', e.target.value)}
                  placeholder="مثال: الفصل ٥"
                />
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-block" disabled={!form.title.trim()}>
          {isEdit ? 'حفظ التعديلات' : 'إضافة المهمة'}
        </button>
      </form>

      <Footer />
    </div>
  );
}