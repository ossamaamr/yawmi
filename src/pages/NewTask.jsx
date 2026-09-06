// ══════════════════════════════════════════════════════════
// pages/NewTask.jsx — إضافة / تعديل مهمة
// يشمل:
//   - ضبط الوقت بصيغة "س:د" (HH:MM) موحّدة وقراءتها وكتابتها بدقة
//   - اختيار نغمة منبه من جهاز المستخدم (audio/*) عبر FilePicker
//   - استعادة قاعدة التكرار والنغمة عند التعديل وتحديثهما صحيحًا
// ══════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { useTaskContext } from '../context/TaskContext';
import Footer from '../components/Footer';
import {
  getRecurrenceRule,
  setRecurrenceRule,
  deleteRecurrenceRuleByTask,
  uid,
} from '../lib/db';
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

// توحيد قيمة الوقت إلى "س:د" (مثال: ١٤:٣٠ ← "14:30")
function normalizeTime(value) {
  if (!value) return '';
  let text = String(value).trim();
  text = text.replace(/[٠-٩]/g, (ch) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(ch)));
  const match = text.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return text;
  let hours = parseInt(match[1], 10);
  let minutes = parseInt(match[2], 10);
  if (hours > 23) hours = 23;
  if (minutes > 59) minutes = 59;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function fileBaseName(name) {
  return name ? String(name).split('/').pop() : '';
}

function toDateInput(ms) {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
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
  ringtone: '',
};

export default function NewTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, addTask, editTask, loading } = useTaskContext();
  const fileRef = useRef(null);

  const isEdit = Boolean(id);
  const existing = isEdit ? tasks.find((t) => t.id === id) : null;

  const [form, setForm] = useState({ ...EMPTY_FORM, date: toDateInput(startOfDay(Date.now())) });
  const [ringtoneName, setRingtoneName] = useState('');

  useEffect(() => {
    if (existing) {
      (async () => {
        const rule = await getRecurrenceRule(existing.id);
        setForm({
          title: existing.title,
          description: existing.description,
          date: toDateInput(existing.dueDate),
          time: existing.dueTime || '',
          isAllDay: !existing.dueTime,
          category: existing.category || 'general',
          priority: existing.priority || 'none',
          repeatType: rule ? rule.type : existing.isRecurring ? 'daily' : '',
          interval: rule?.interval || 1,
          daysOfWeek: rule?.daysOfWeek || [],
          isProgressive: existing.isProgressive,
          totalAmount: existing.progressionTotal || 5,
          target: '',
          ringtone: existing.ringtone || '',
        });
        setRingtoneName(existing.ringtone ? fileBaseName(existing.ringtone) : '');
      })();
    }
  }, [existing]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (d) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d],
    }));
  };

  // ── اختيار نغمة من الجهاز (أو الملف على الويب) ──
  const pickRingtone = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FilePicker.pickFiles({ types: ['audio/*'], limit: 1 });
        const file = result.files?.[0];
        if (file) {
          set('ringtone', file.path || file.name || '');
          setRingtoneName(file.name || '');
        }
      } else {
        fileRef.current?.click();
      }
    } catch {
      /* المستخدم ألغى أو فشل المنتقي — لا شيء */
    }
  };

  const handleWebFile = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      set('ringtone', url);
      setRingtoneName(file.name);
    }
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const dueDate = startOfDay(new Date(form.date).getTime());
    const dueTime = form.isAllDay ? null : normalizeTime(form.time) || null;
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
      dueTime,
      isAllDay: form.isAllDay,
      category: form.category,
      priority: form.priority,
      recurrence,
      ringtone: form.ringtone || null,
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
        ringtone: payload.ringtone,
      });

      // حفظ/تحديث قاعدة التكرار عند التعديل
      if (payload.recurrence) {
        const rule = (await getRecurrenceRule(existing.id)) || {
          id: uid('rr'),
          taskId: existing.id,
          startDate: payload.dueDate,
          endDate: null,
          dayOfMonth: null,
          monthOfYear: null,
          maxOccurrences: null,
          createdAt: Date.now(),
        };
        await setRecurrenceRule({
          ...rule,
          type: payload.recurrence.type,
          interval: payload.recurrence.interval,
          daysOfWeek: payload.recurrence.daysOfWeek,
          startDate: payload.recurrence.startDate,
          updatedAt: Date.now(),
        });
        await editTask(existing.id, { isRecurring: true });
      } else if (existing.isRecurring) {
        await deleteRecurrenceRuleByTask(existing.id);
        await editTask(existing.id, { isRecurring: false, recurrenceId: null });
      }

      navigate(`/task/${existing.id}`);
    } else {
      const created = await addTask(payload);
      navigate(`/task/${created.id}`);
    }
  };

  if (loading) {
    return (
      <div className="صفحة">
        <div className="شاشة-مركزية">
          <div className="مؤشر" />
        </div>
      </div>
    );
  }

  const needsDays = form.repeatType === 'weekly' || form.repeatType === 'specific_days';

  return (
    <div className="صفحة">
      <header className="رأس-الصفحة">
        <button type="button" className="زر-أيقونة" onClick={() => navigate(-1)} aria-label="رجوع">
          →
        </button>
        <h1>{isEdit ? 'تعديل المهمة' : 'مهمة جديدة'}</h1>
      </header>

      <form className="بطاقة بطاقة-النموذج" onSubmit={submit}>
        <div className="حقل">
          <label htmlFor="task-title">عنوان المهمة</label>
          <input
            id="task-title"
            className="مدخل"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="مثال: قراءة ٢٠ صفحة"
          />
        </div>

        <div className="حقل">
          <label htmlFor="task-desc">وصف (اختياري)</label>
          <textarea
            id="task-desc"
            className="منطقة-نص"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="ملاحظات إضافية…"
          />
        </div>

        <div className="صف-الحقول">
          <div className="حقل مرن">
            <label htmlFor="task-date">التاريخ</label>
            <input
              id="task-date"
              className="مدخل"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>
          <div className="حقل مرن">
            <label htmlFor="task-time">الوقت</label>
            <input
              id="task-time"
              className="مدخل"
              type="time"
              value={form.time}
              disabled={form.isAllDay}
              onChange={(e) => set('time', e.target.value)}
              onBlur={(e) => set('time', normalizeTime(e.target.value))}
            />
          </div>
        </div>

        <label className="صف-التحديد">
          <input
            type="checkbox"
            checked={form.isAllDay}
            onChange={(e) => {
              set('isAllDay', e.target.checked);
              if (e.target.checked) set('time', '');
            }}
          />
          <span>مهمة طوال اليوم (بدون وقت محدد)</span>
        </label>

        <div className="حقل">
          <label>نغمة المنبه</label>
          <div className="صف">
            <button type="button" className="زر زر-شفاف مرن" onClick={pickRingtone}>
              {ringtoneName ? `✅ ${ringtoneName}` : 'اختر نغمة منبه من جهازك'}
            </button>
            {form.ringtone && (
              <button type="button" className="زر-أيقونة" onClick={() => { set('ringtone', ''); setRingtoneName(''); }} aria-label="إزالة النغمة">
                ✕
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="مخفي-بصريا"
            onChange={handleWebFile}
          />
        </div>

        <div className="صف-الحقول">
          <div className="حقل مرن">
            <label htmlFor="task-category">الفئة</label>
            <select id="task-category" className="قائمة" value={form.category} onChange={(e) => set('category', e.target.value)}>
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
          <div className="حقل مرن">
            <label htmlFor="task-priority">الأولوية</label>
            <select id="task-priority" className="قائمة" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="none">بدون</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
        </div>

        <div className="حقل">
          <label htmlFor="task-repeat">التكرار</label>
          <select id="task-repeat" className="قائمة" value={form.repeatType} onChange={(e) => set('repeatType', e.target.value)}>
            {REPEAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {form.repeatType === 'daily' && (
          <div className="حقل">
            <label>التردد</label>
            <div className="صف-أزرار-صغيرة">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`زر-صغير ${Number(form.interval) === n ? 'نشط' : ''}`}
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
          <div className="حقل">
            <label>اختر الأيام</label>
            <div className="صف-أزرار-صغيرة">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`زر-صغير ${form.daysOfWeek.includes(idx) ? 'نشط' : ''}`}
                  onClick={() => toggleDay(idx)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="حقل">
          <label className="صف-التحديد">
            <input
              type="checkbox"
              checked={form.isProgressive}
              onChange={(e) => set('isProgressive', e.target.checked)}
            />
            <span>📈 مهمة تدريجية (تتقدّم بالإكمال فقط)</span>
          </label>
          {form.isProgressive && (
            <div className="صف-الحقول">
              <div className="حقل مرن">
                <label htmlFor="task-total">إجمالي الخطوات</label>
                <input
                  id="task-total"
                  className="مدخل"
                  type="number"
                  min="1"
                  value={form.totalAmount}
                  onChange={(e) => set('totalAmount', e.target.value)}
                />
              </div>
              <div className="حقل مرن">
                <label htmlFor="task-target">الهدف (نص اختياري)</label>
                <input
                  id="task-target"
                  className="مدخل"
                  value={form.target}
                  onChange={(e) => set('target', e.target.value)}
                  placeholder="مثال: الفصل ٥"
                />
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="زر زر-بعرض-كامل" disabled={!form.title.trim()}>
          {isEdit ? 'حفظ التعديلات' : 'إضافة المهمة'}
        </button>
      </form>

      <Footer />
    </div>
  );
}