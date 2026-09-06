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
      <div className="page">
        <div className="center-screen">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">؟</div>
          <h3>المهمة غير موجودة</h3>
          <Link to="/" className="btn">العودة لليوم</Link>
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
    <div className="page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="رجوع">
          →
        </button>
        <h1>تفاصيل المهمة</h1>
        <Link to={`/task/${task.id}/edit`} className="btn btn-sm btn-soft">تعديل</Link>
      </header>

      <div className="card detail-card">
        <div className="row-between">
          <h2 className={isDone ? 'strikethrough' : ''}>{task.title}</h2>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && <p className="detail-desc">{task.description}</p>}

        <div className="detail-list">
          <div className="detail-row">
            <span className="detail-label">التاريخ</span>
            <span>{relativeDayLabel(task.dueDate)} — {formatArabicDate(task.dueDate)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">الوقت</span>
            <span>{task.dueTime || 'طوال اليوم'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">الفئة</span>
            <span><CategoryBadge category={task.category} /> {task.category}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">التكرار</span>
            <span>{task.isRecurring ? '🔁 متكرر' : 'بدون تكرار'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">التقدم</span>
            <span>{task.isProgressive ? '📈 تدريجي' : '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">الحالة</span>
            <span>{isDone ? 'مكتملة ✓' : 'نشطة'}</span>
          </div>
          {task.completedAt && (
            <div className="detail-row">
              <span className="detail-label">أُنجزت في</span>
              <span>{formatArabicDate(task.completedAt)}</span>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className={`btn ${isDone ? 'btn-soft' : 'btn-accent'}`}
            onClick={() => completeTask(task.id, Date.now())}
          >
            {isDone ? 'إلغاء الإكمال' : 'إكمال المهمة ✓'}
          </button>
          <button
            type="button"
            className={`btn ${confirming ? 'btn-danger' : 'btn-ghost'}`}
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