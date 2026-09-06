// ══════════════════════════════════════════════════════════
// pages/TaskDetail.jsx — تفاصيل المهمة
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';
import Footer from '../components/Footer';
import { CategoryBadge, PriorityBadge } from '../components/TaskCard';
import {
  formatArabicDate,
  formatArabicTime,
  relativeDayLabel,
} from '../lib/utils';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, completeTask, removeTask, loading } = useTaskContext();
  const [confirming, setConfirming] = useState(false);

  const task = tasks.find((t) => t.id === id);

  if (loading) {
    return (
      <div className="صفحة">
        <div className="شاشة-مركزية">
          <div className="مؤشر" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="صفحة">
        <div className="فارغ">
          <div className="أيقونة-فارغ">؟</div>
          <h3>المهمة غير موجودة</h3>
          <Link to="/" className="زر">العودة لليوم</Link>
        </div>
      </div>
    );
  }

  const isDone = task.status === 'completed';

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await removeTask(task.id);
    navigate('/', { replace: true });
  };

  return (
    <div className="صفحة">
      <header className="رأس-الصفحة">
        <button type="button" className="زر-أيقونة" onClick={() => navigate(-1)} aria-label="رجوع">
          →
        </button>
        <h1>تفاصيل المهمة</h1>
        <Link to={`/task/${task.id}/edit`} className="زر زر-صغير زر-ناعم">تعديل</Link>
      </header>

      <div className="بطاقة بطاقة-التفاصيل">
        <div className="صف-بين">
          <h2 className={isDone ? 'مشطوب' : ''}>{task.title}</h2>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && <p className="وصف-التفاصيل">{task.description}</p>}

        <div className="قائمة-التفاصيل">
          <div className="صف-التفاصيل">
            <span className="تسمية-التفاصيل">التاريخ</span>
            <span>{relativeDayLabel(task.dueDate)} — {formatArabicDate(task.dueDate)}</span>
          </div>
          <div className="صف-التفاصيل">
            <span className="تسمية-التفاصيل">الوقت</span>
            <span>{task.dueTime ? formatArabicTime(task.dueTime) : 'طوال اليوم'}</span>
          </div>
          <div className="صف-التفاصيل">
            <span className="تسمية-التفاصيل">الفئة</span>
            <span><CategoryBadge category={task.category} /></span>
          </div>
          <div className="صف-التفاصيل">
            <span className="تسمية-التفاصيل">التكرار</span>
            <span>{task.isRecurring ? '🔁 متكرر' : 'بدون تكرار'}</span>
          </div>
          {task.ringtone && (
            <div className="صف-التفاصيل">
              <span className="تسمية-التفاصيل">نغمة المنبه</span>
              <span>🔔 نغمة مخصصة</span>
            </div>
          )}
          <div className="صف-التفاصيل">
            <span className="تسمية-التفاصيل">التقدم</span>
            <span>{task.isProgressive ? '📈 تدريجي' : '—'}</span>
          </div>
          <div className="صف-التفاصيل">
            <span className="تسمية-التفاصيل">الحالة</span>
            <span>{isDone ? 'مكتملة ✓' : 'نشطة'}</span>
          </div>
          {task.completedAt && (
            <div className="صف-التفاصيل">
              <span className="تسمية-التفاصيل">أُنجزت في</span>
              <span>{formatArabicDate(task.completedAt)}</span>
            </div>
          )}
        </div>

        <div className="أزرار-التفاصيل">
          <button
            type="button"
            className={`زر ${isDone ? 'زر-ناعم' : 'زر-مميز'}`}
            onClick={() => completeTask(task.id, Date.now())}
          >
            {isDone ? 'إلغاء الإكمال' : 'إكمال المهمة ✓'}
          </button>
          <button
            type="button"
            className={`زر ${confirming ? 'زر-خطر' : 'زر-شفاف'}`}
            onClick={handleDelete}
          >
            {confirming ? 'تأكيد الحذف؟' : 'حذف'}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}