// ══════════════════════════════════════════════════════════
// pages/Settings.jsx — الإعدادات
// تشمل الإشعارات مع التوجيه لإعدادات النظام عند رفض الإذن.
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { useSettingsContext } from '../context/SettingsContext';
import { useTaskContext } from '../context/TaskContext';
import Footer from '../components/Footer';
import { exportAllData, importAllData, clearAllData } from '../lib/db';
import { cancelAllNotifications } from '../lib/notifications';
import { toArabicNumerals } from '../lib/utils';

const PALETTES = [
  { value: 'default', label: 'أصلي', color: '#4d7c4a' },
  { value: 'olive', label: 'زيتوني', color: '#4d7c4a' },
  { value: 'royal', label: 'ملكي', color: '#3b5a9a' },
  { value: 'rose', label: 'وردي', color: '#b0426f' },
  { value: 'amber', label: 'كهرماني', color: '#b3701a' },
  { value: 'plum', label: 'خمري', color: '#74508f' },
];

export default function Settings() {
  const settings = useSettingsContext();
  const { tasks, reload } = useTaskContext();
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifDenied, setNotifDenied] = useState(false);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const doExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yawmi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('تم تصدير بياناتك إلى ملف.');
  };

  const doImport = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const ok = await importAllData(data);
      await cancelAllNotifications();
      await reload();
      flash(ok ? 'تم استيراد البيانات بنجاح.' : 'ملف غير صالح.');
    } catch {
      flash('تعذّر قراءة الملف.');
    }
  };

  const doReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await cancelAllNotifications();
    await clearAllData();
    await reload();
    setConfirmReset(false);
    flash('تم مسح جميع البيانات.');
  };

  const handleEnable = async () => {
    const granted = await settings.enableNotifications();
    if (!granted) setNotifDenied(true);
  };

  return (
    <div className="صفحة">
      <header className="رأس-الصفحة">
        <h1>الإعدادات</h1>
      </header>

      {message && <div className="تنبيه تنبيه-نجاح">{message}</div>}

      <div className="بطاقة بطاقة-الإعدادات">
        <h2>المظهر</h2>
        <div className="حقل">
          <label>الثيم</label>
          <div className="صف-أزرار-صغيرة">
            <button type="button" className={`زر-صغير ${settings.theme === 'light' ? 'نشط' : ''}`} onClick={() => settings.update({ theme: 'light' })}>
              ☀️ فاتح
            </button>
            <button type="button" className={`زر-صغير ${settings.theme === 'dark' ? 'نشط' : ''}`} onClick={() => settings.update({ theme: 'dark' })}>
              🌙 داكن
            </button>
            <button type="button" className={`زر-صغير ${settings.theme === 'system' ? 'نشط' : ''}`} onClick={() => settings.update({ theme: 'system' })}>
              🖥 النظام
            </button>
          </div>
        </div>

        <div className="حقل">
          <label>اللون الأساسي</label>
          <div className="صف-أزرار-صغيرة">
            {PALETTES.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`زر-صغير ${settings.palette === p.value ? 'نشط' : ''}`}
                onClick={() => settings.update({ palette: p.value })}
              >
                <span className="نقطة-اللوحة" style={{ background: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="حقل">
          <label>حجم الخط</label>
          <div className="صف-أزرار-صغيرة">
            <button type="button" className={`زر-صغير ${settings.fontSize === 'normal' ? 'نشط' : ''}`} onClick={() => settings.update({ fontSize: 'normal' })}>
              عادي
            </button>
            <button type="button" className={`زر-صغير ${settings.fontSize === 'large' ? 'نشط' : ''}`} onClick={() => settings.update({ fontSize: 'large' })}>
              كبير
            </button>
          </div>
        </div>
      </div>

      <div className="بطاقة بطاقة-الإعدادات">
        <h2>الإشعارات</h2>
        <p className="نص-ناعم">الإشعارات محلية بالكامل وتعمل دون إنترنت.</p>
        {settings.notificationsEnabled ? (
          <button type="button" className="زر زر-شفاف" onClick={() => settings.disableNotifications()}>
            إيقاف الإشعارات
          </button>
        ) : notifDenied ? (
          <button type="button" className="زر" onClick={settings.goToNotificationSettings}>
            الفتح من إعدادات النظام
          </button>
        ) : (
          <button type="button" className="زر" onClick={handleEnable}>
            تفعيل الإشعارات
          </button>
        )}
      </div>

      <div className="بطاقة بطاقة-الإعدادات">
        <h2>البيانات</h2>
        <div className="عمود">
          <p className="نص-ناعم">عدد المهام: {toArabicNumerals(tasks.length)} — كل بياناتك على جهازك فقط.</p>
          <button type="button" className="زر زر-ناعم" onClick={doExport}>تصدير البيانات (نسخة احتياطية)</button>
          <label className="زر زر-ناعم زر-بعرض-كامل">
            استيراد نسخة احتياطية
            <input
              type="file"
              accept="application/json"
              className="مخفي-بصريا"
              onChange={(e) => {
                if (e.target.files?.[0]) doImport(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </label>
          <button type="button" className={`زر ${confirmReset ? 'زر-خطر' : 'زر-شفاف'}`} onClick={doReset}>
            {confirmReset ? 'تأكيد مسح كل البيانات؟' : 'إعادة تعيين البيانات'}
          </button>
        </div>
      </div>

      <div className="بطاقة بطاقة-الإعدادات">
        <h2>حول</h2>
        <p>
          <strong>يومي</strong> — تطبيق مهام يومية يخدمك في وردك وعبادتك وتنظيم وقتك.
          التطبيق يعمل محليًا بالكامل: لا خادم خارجي ولا حساب ولا مزامنة، وبياناتك تبقى على جهازك.
        </p>
        <p className="نص-ناعم">الإصدار ٢٫٠٫٠.</p>
      </div>

      <Footer />
    </div>
  );
}