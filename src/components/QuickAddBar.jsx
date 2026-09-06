// ══════════════════════════════════════════════════════════
// components/QuickAddBar.jsx — شريط الإضافة السريعة
// يفهم العربية: "قراءة ساعة غداً" "تمارين كل يوم" "مذاكرة الساعة ٨"
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseQuickAdd } from '../lib/utils';
import { useTaskContext } from '../context/TaskContext';

export default function QuickAddBar() {
  const [text, setText] = useState('');
  const { addTask } = useTaskContext();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;

    const parsed = parseQuickAdd(value);
    const created = await addTask({
      title: parsed.title,
      dueDate: parsed.date,
      dueTime: parsed.time,
      recurrence: parsed.recurrence ? { type: parsed.recurrence.type, interval: parsed.recurrence.interval } : null,
    });

    setText('');
    if (parsed.time || parsed.recurrence) navigate(`/task/${created.id}`);
  };

  return (
    <form className="quick-add" onSubmit={submit}>
      <input
        className="input quick-add-input"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="أضف مهمة سريعة… مثال: قراءة ساعة غداً الساعة ٨"
        aria-label="إضافة مهمة سريعة"
      />
      <button type="submit" className="btn btn-accent quick-add-btn" disabled={!text.trim()}>
        ✓
      </button>
    </form>
  );
}