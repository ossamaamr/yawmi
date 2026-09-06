// ══════════════════════════════════════════════════════════
// components/Header.jsx — الشريط العلوي: تحية حسب الوقت + الساعة + التاريخ
// كل الأوقات مقروءة من ساعة الجهاز المحلية (Date.now()).
// ══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { formatArabicDate, formatArabicTime } from '../lib/utils';

// التحية حسب الفترة الزمنية
function greetingFor(hours) {
  if (hours >= 5 && hours < 12) return { text: 'صباح الخير', icon: '🌅' };
  if (hours >= 12 && hours < 16) return { text: 'طاب يومك', icon: '☀️' };
  if (hours >= 16 && hours < 20) return { text: 'مساء الخير', icon: '🌇' };
  return { text: 'طابت ليلتك', icon: '🌙' };
}

export default function Header() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const date = new Date(now);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hhmm = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const greeting = greetingFor(hours);

  return (
    <header className="الشريط-العلوي">
      <div className="تحية-اليوم">
        <span className="تحية-نص">{greeting.text}</span>
        <span className="تحية-أيقونة">{greeting.icon}</span>
        <span className="وقت-الآن">{formatArabicTime(hhmm)}</span>
      </div>
      <div className="تاريخ-اليوم">{formatArabicDate(now)}</div>
    </header>
  );
}