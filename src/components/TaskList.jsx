// ══════════════════════════════════════════════════════════
// components/TaskList.jsx — قائمة المهام لليوم، مع حالات فارغة
// ══════════════════════════════════════════════════════════
import TaskCard from './TaskCard';
import { toArabicNumerals } from '../lib/utils';

function DaySection({ label, items, onToggle }) {
  const pending = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  if (items.length === 0) return null;

  return (
    <div className="day-section">
      <div className="day-section-header">
        <h3>{label}</h3>
        <span className="count-badge">
          {pending.length ? `${toArabicNumerals(pending.length)} باقية` : 'مكتمل ✓'}
        </span>
      </div>
      {pending.map((item) => (
        <TaskCard key={item.task.id} item={item} onToggle={onToggle} />
      ))}
      {done.length > 0 && (
        <div className="done-group">
          {done.map((item) => (
            <TaskCard key={item.task.id} item={item} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskList({ sections, onToggle, emptyTitle, emptyHint }) {
  if (!sections || sections.length === 0 || sections.every((s) => !s.items.length)) {
    return (
      <div className="empty">
        <div className="empty-icon">✓</div>
        <h3>{emptyTitle || 'لا توجد مهام'}</h3>
        <p>{emptyHint || 'أضف مهمة جديدة لبدء يومك'}</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {sections.map((s) => (
        <DaySection
          key={s.key || s.dayStart}
          label={s.label}
          items={s.items || []}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}