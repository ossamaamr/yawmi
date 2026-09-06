// ══════════════════════════════════════════════════════════
// components/TaskCard.jsx — بطاقة المهمة
// ══════════════════════════════════════════════════════════
import { Link } from 'react-router-dom';
import { formatArabicTime } from '../lib/utils';

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
  high: { label: 'عالية', cls: 'وسم-عالية' },
  medium: { label: 'متوسطة', cls: 'وسم-متوسطة' },
  low: { label: 'منخفضة', cls: 'وسم-منخفضة' },
  none: null,
};

export function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.general;
  return (
    <span className="حبة-الفئة">
      <span className="نقطة-الفئة" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;
  return <span className={`وسم ${meta.cls}`}>{meta.label}</span>;
}

export default function TaskCard({ item, onToggle, extra }) {
  const { task, completed, progression } = item;
  const meta = CATEGORY_META[task.category] || CATEGORY_META.general;

  return (
    <div className={`بطاقة-المهمة ${completed ? 'منجزة' : ''}`}>
      <button
        type="button"
        className={`زر-التحديد ${completed ? 'محدد' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={completed ? 'إلغاء الإكمال' : 'إكمال المهمة'}
      >
        {completed ? '✓' : ''}
      </button>

      <Link to={`/task/${task.id}`} className="جسم-البطاقة">
        <div className="عنوان-المهمة">{task.title}</div>
        <div className="بيانات-المهمة">
          <span className="حبة-الفئة">
            <span className="نقطة-الفئة" style={{ background: meta.color }} />
            {meta.label}
          </span>
          {task.dueTime && <span className="عنصر-البيانات">🕐 {formatArabicTime(task.dueTime)}</span>}
          {task.isRecurring && <span className="عنصر-البيانات">🔁 متكرر</span>}
          <PriorityBadge priority={task.priority} />
          {progression && (
            <span className="عنصر-البيانات وسم-التقدم">
              التقدم {progression.completedAmount}/{progression.totalAmount}
            </span>
          )}
        </div>
      </Link>

      {extra}
    </div>
  );
}