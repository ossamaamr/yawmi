// ══════════════════════════════════════════════════════════
// pages/QuranDaily.jsx — صفحة الورد اليومي من القرآن الكريم
// جوهر التطبيق: نوع الورد + التقدم + مهمة اليوم + زر الإكمال.
// الحالة (النوع/اليوم/الأيام/الحماسة) تُدار عبر SettingsContext
// وتُخزَّن في IndexedDB محليًا بالكامل.
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import Footer from '../components/Footer';
import { useSettingsContext } from '../context/SettingsContext';
import { WIRD_TYPES, progressForDay, arNum } from '../lib/quran';

export default function QuranDaily() {
  const settings = useSettingsContext();
  const { completeQuranWird, setQuranType } = settings;
  const [flash, setFlash] = useState('');

  const quranType = settings.quranWirdType || 'juz';
  const current = progressForDay(quranType, settings.quranDay || 1);
  const streak = settings.quranStreak || 0;

  const typeInfo = WIRD_TYPES.find((t) => t.key === quranType) || WIRD_TYPES[0];

  const noteFlash = (text) => {
    setFlash(text);
    setTimeout(() => setFlash(''), 3000);
  };

  const handleComplete = async () => {
    await completeQuranWird();
    noteFlash('ما شاء الله! تقدمت لورد الغد تلقائيًا.');
  };

  const handleTypeChange = async (e) => {
    const nextType = e.target.value;
    if (nextType === quranType) return;
    await setQuranType(nextType);
    noteFlash('تم تحديد نوع الورد، وبدأ عدّاد اليوم من جديد.');
  };

  const progressWidth = Math.min(100, current.percent);

  return (
    <div className="صفحة">
      <header className="رأس-الصفحة">
        <h1>الورد اليومي</h1>
      </header>

      {flash && <div className="تنبيه تنبيه-نجاح">{flash}</div>}

      <div className="بطاقة بطاقة-الورد">
        <div className="لافتة-الورد">
          <span className="لافتة-أيقونة">📖</span>
          <span>ورد من كتاب الله</span>
        </div>

        <div className="حقل">
          <label htmlFor="wird-type">نوع الورد اليومي</label>
          <select
            id="wird-type"
            className="قائمة"
            value={quranType}
            onChange={handleTypeChange}
          >
            {WIRD_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="صف-بين سطر-الحماسة">
          <span className="وسم-الحماسة">
            {streak > 0 ? `🔥 حماسك ${arNum(streak)} ${streak === 1 ? 'يوم' : streak === 2 ? 'يومان' : 'أيام'} متتالية` : 'ابدأ يومك الأول'}
          </span>
        </div>

        <div className="صف-بين سطر-التقدم">
          <span className="نص-ناعم">
            اليوم {arNum(current.day)} من {arNum(current.totalDays)}
          </span>
          <span className="نص-ناعم">{arNum(progressWidth)}٪</span>
        </div>
        <div className="مسار-التقدم">
          <div className="حشو-التقدم حشو-الورد" style={{ width: `${progressWidth}%` }} />
        </div>

        <div className="بيان-الورد">
          {current.juzLabel && <p className="سطر-الورد"><span className="تسمية-الورد">الجزء</span> {current.juzLabel}</p>}
          <p className="سطر-الورد">
            <span className="تسمية-الورد">الصفحات</span> من {arNum(current.pageStart)} إلى {arNum(current.pageEnd)}
          </p>
        </div>

        <div className="قائمة-سور-الورد">
          {current.segments.map((seg) => (
            <div key={seg.index} className="سورة-الورد">
              <span className="اسم-السورة">{seg.name}</span>
              <span className="نطاق-الآيات">
                الآيات {arNum(seg.startAyah)}–{arNum(seg.endAyah)}
                <span className="صفحات-السورة">
                  {' '}· ص {arNum(seg.startPage)}{seg.endPage !== seg.startPage ? `–${arNum(seg.endPage)}` : ''}
                </span>
              </span>
            </div>
          ))}
          {current.segments.length === 0 && (
            <p className="نص-ناعم">لا توجد بيانات لهذا اليوم.</p>
          )}
        </div>

        <button type="button" className="زر زر-بعرض-كامل زر-الورد" onClick={handleComplete}>
          ✓ أكملت هذا الورد اليوم
        </button>
        <p className="نص-ناعم نص-مركز ملاحظة-الورد">
          {typeInfo.label} — بعد الإكمال ينتقل التطبيق ليوم الغد تلقائيًا.
        </p>
      </div>

      <Footer />
    </div>
  );
}