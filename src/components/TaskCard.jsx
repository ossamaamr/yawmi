// ══════════════════════════════════════════════════════════
// components/TaskCard.jsx — بطاقة المهمة
// ══════════════════════════════════════════════════════════
import { Link } from 'react-router-dom';

export const CATEGORY_META = {
  general: { label: 'عام', color: 'var(--color-primary)' },
  personal: { label: 'شخصي', color: '#b0426f' },
  work: { label: 'عمل', color: '#3b5a9a' },
  health: { label: 'صحة', color: '#4d7c4a' },
  education: { label: 'تعليم', color: '#b3701a' },
  home: { label: 'منزل', color: '#74508f' },
  family: { label: 'عائلة', color: '#8a3b2e' },
  worship: { label: 'عبادة', color: '#2e7d6b' },
  other: { label: 'أخرى', color: 'var(--color-text-soft)' },
};

export const PRIORITY_META = {
  high: { label: 'عالية', cls: 'badge-priority-high' },
  medium: { label: 'متوسطة', cls: 'badge-priority-medium' },
  low: { label: 'منخفضة', cls: 'badge-priority-low' },
  none: null,
};

export function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.general;
  return (
    <span className="category-dot" style={{ background: meta.color }} title={meta.label}>
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

export default function TaskCard({ item, onToggle, extra }) {
  const { task, completed, progression } = item;
  const meta = CATEGORY_META[task.category] || CATEGORY_META.general;

  return (
    <div className={`task-card ${completed ? 'is-completed' : ''}`}>
      <button
        type="button"
        className={`check-btn ${completed ? 'is-checked' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={completed ? 'إلغاء الإكمال' : 'إكمال المهمة'}
      >
        {completed ? '✓' : ''}
      </button>

      <Link to={`/task/${task.id}`} className="task-card-body">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span className="category-pill">
            <span className="category-dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
          {task.dueTime && <span className="meta-item">🕐 {task.dueTime}</span>}
          {task.isRecurring && <span className="meta-item">🔁 متكرر</span>}
          <PriorityBadge priority={task.priority} />
          {progression && (
            <span className="meta-item progress-chip">
              التقدم {progression.completedAmount}/{progression.totalAmount}
            </span>
          )}
        </div>
      </Link>

      {extra}
    </div>
  );
}