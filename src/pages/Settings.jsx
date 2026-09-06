// ══════════════════════════════════════════════════════════
// pages/Settings.jsx — الإعدادات
// ══════════════════════════════════════════════════════════
import { useState } from 'react';
import { useSettingsContext } from '../context/SettingsContext';
import { useTaskContext } from '../context/TaskContext';
import Footer from '../components/Footer';
import { exportAllData, importAllData, clearAllData } from '../lib/db';
import { cancelAllNotifications } from '../lib/notifications';

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

  return (
    <div className="page">
      <header className="page-header">
        <h1>الإعدادات</h1>
      </header>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card settings-card">
        <h2>المظهر</h2>
        <div className="field">
          <label>الثيم</label>
          <div className="chip-row">
            <button type="button" className={`chip ${settings.theme === 'light' ? 'active' : ''}`} onClick={() => settings.update({ theme: 'light' })}>
              ☀️ فاتح
            </button>
            <button type="button" className={`chip ${settings.theme === 'dark' ? 'active' : ''}`} onClick={() => settings.update({ theme: 'dark' })}>
              🌙 داكن
            </button>
            <button type="button" className={`chip ${settings.theme === 'system' ? 'active' : ''}`} onClick={() => settings.update({ theme: 'system' })}>
              🖥 النظام
            </button>
          </div>
        </div>

        <div className="field">
          <label>اللون الأساسي</label>
          <div className="chip-row">
            {PALETTES.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`chip ${settings.palette === p.value ? 'active' : ''}`}
                onClick={() => settings.update({ palette: p.value })}
              >
                <span className="palette-dot" style={{ background: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>حجم الخط</label>
          <div className="chip-row">
            <button type="button" className={`chip ${settings.fontSize === 'normal' ? 'active' : ''}`} onClick={() => settings.update({ fontSize: 'normal' })}>
              عادي
            </button>
            <button type="button" className={`chip ${settings.fontSize === 'large' ? 'active' : ''}`} onClick={() => settings.update({ fontSize: 'large' })}>
              كبير
            </button>
          </div>
        </div>
      </div>

      <div className="card settings-card">
        <h2>الإشعارات</h2>
        <p className="text-soft">الإشعارات محلية بالكامل وتعمل بدون إنترنت.</p>
        {settings.notificationsEnabled ? (
          <button type="button" className="btn btn-ghost" onClick={() => settings.disableNotifications()}>
            إيقاف الإشعارات
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => settings.enableNotifications()}>
            تفعيل الإشعارات
          </button>
        )}
      </div>

      <div className="card settings-card">
        <h2>البيانات</h2>
        <div className="stack">
          <p className="text-soft">عدد المهام: {tasks.length} — كل بياناتك على جهازك فقط.</p>
          <button type="button" className="btn btn-soft" onClick={doExport}>تصدير البيانات (نسخة احتياطية)</button>
          <label className="btn btn-soft btn-block">
            استيراد نسخة احتياطية
            <input
              type="file"
              accept="application/json"
              className="visually-hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) doImport(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </label>
          <button type="button" className={`btn ${confirmReset ? 'btn-danger' : 'btn-ghost'}`} onClick={doReset}>
            {confirmReset ? 'تأكيد مسح كل البيانات؟' : 'إعادة تعيين البيانات'}
          </button>
        </div>
      </div>

      <div className="card settings-card">
        <h2>حول</h2>
        <p>
          <strong>يومي</strong> — تطبيق مهام يومية، محلي بالكامل (Offline-first):
          لا يوجد خادم خارجي، ولا حساب، ولا مزامنة. بياناتك تبقى على جهازك.
        </p>
        <p className="text-soft">الإصدار 2.0.0 — مبني بمحرك Capacitor لتطبيقات أندرويد.</p>
      </div>

      <Footer />
    </div>
  );
}