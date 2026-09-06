// ══════════════════════════════════════════════════════════
// context/SettingsContext.jsx — الإعدادات (الثيم، الخط، الإشعارات)
// تُحفظ في IndexedDB وتُطبّق مباشرة على جذر الصفحة.
// يتضمّن أيضًا حالة الورد القرآني (الحماسة، اليوم، الإنجازات)
// حتى تظهر الحماسة في أعلى صفحة "اليوم" وصفحة "الورد" فورًا.
// ══════════════════════════════════════════════════════════
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSetting, setSetting } from '../lib/db';
import {
  requestNotificationPermission,
  notificationsSupported,
  cancelAllNotifications,
  openSystemNotificationSettings,
} from '../lib/notifications';
import {
  WIRD_TYPES,
  QURAN_KEYS,
  DEFAULT_QURAN_STATE,
  nextStreak,
  nextDayState,
} from '../lib/quran';
import { startOfDay } from '../lib/utils';

const SettingsContext = createContext(null);

const DEFAULTS = {
  theme: 'light', // light | dark | system
  palette: 'default', // default | olive | royal | rose | amber | plum
  fontSize: 'normal', // normal | large
  notificationsEnabled: false,
  [QURAN_KEYS.type]: DEFAULT_QURAN_STATE.type,
  [QURAN_KEYS.day]: DEFAULT_QURAN_STATE.day,
  [QURAN_KEYS.daysDone]: DEFAULT_QURAN_STATE.daysDone,
  [QURAN_KEYS.totalDays]: DEFAULT_QURAN_STATE.totalDays,
  [QURAN_KEYS.streak]: DEFAULT_QURAN_STATE.streak,
  [QURAN_KEYS.lastCompleted]: DEFAULT_QURAN_STATE.lastCompleted,
};

const MS_PER_DAY = 86_400_000;

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ ...DEFAULTS, loaded: false });
  const [notificationsSupportedFlag, setNotificationsSupportedFlag] = useState(true);

  useEffect(() => {
    (async () => {
      const theme = await getSetting('theme', DEFAULTS.theme);
      const palette = await getSetting('palette', DEFAULTS.palette);
      const fontSize = await getSetting('fontSize', DEFAULTS.fontSize);
      const notificationsEnabled = await getSetting('notificationsEnabled', false);
      const quranWirdType = await getSetting(QURAN_KEYS.type, DEFAULTS[QURAN_KEYS.type]);
      const quranDay = await getSetting(QURAN_KEYS.day, DEFAULTS[QURAN_KEYS.day]);
      const quranDaysDone = await getSetting(QURAN_KEYS.daysDone, DEFAULTS[QURAN_KEYS.daysDone]);
      const quranStreak = await getSetting(QURAN_KEYS.streak, DEFAULTS[QURAN_KEYS.streak]);
      const quranLastCompleted = await getSetting(QURAN_KEYS.lastCompleted, DEFAULTS[QURAN_KEYS.lastCompleted]);
      const typeInfo = WIRD_TYPES.find((t) => t.key === quranWirdType) || WIRD_TYPES[0];
      setSettings({
        ...DEFAULTS,
        theme,
        palette,
        fontSize,
        notificationsEnabled,
        [QURAN_KEYS.type]: quranWirdType,
        [QURAN_KEYS.day]: quranDay,
        [QURAN_KEYS.daysDone]: quranDaysDone,
        [QURAN_KEYS.totalDays]: typeInfo.totalDays,
        [QURAN_KEYS.streak]: quranStreak,
        [QURAN_KEYS.lastCompleted]: quranLastCompleted,
        loaded: true,
      });

      try {
        const supported = await notificationsSupported();
        setNotificationsSupportedFlag(supported);
      } catch {
        setNotificationsSupportedFlag(true);
      }
    })();
  }, []);

  // تطبيق الثيم على <html>
  useEffect(() => {
    if (!settings.loaded) return;
    const root = document.documentElement;
    const applies = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('theme-dark', applies);
    root.classList.toggle('font-large', settings.fontSize === 'large');
    document.body.classList.remove('palette-olive', 'palette-royal', 'palette-rose', 'palette-amber', 'palette-plum');
    if (settings.palette !== 'default') document.body.classList.add(`palette-${settings.palette}`);
  }, [settings]);

  const update = useCallback(async (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      for (const [key, value] of Object.entries(patch)) {
        setSetting(key, value);
      }
      return next;
    });
  }, []);

  const enableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      await update({ notificationsEnabled: true });
    }
    return granted;
  }, [update]);

  const disableNotifications = useCallback(async () => {
    await cancelAllNotifications();
    await update({ notificationsEnabled: false });
  }, [update]);

  // فتح إعدادات النظام عند رفض إذن الإشعارات
  const goToNotificationSettings = useCallback(async () => {
    await openSystemNotificationSettings();
  }, []);

  // تغيير نوع الورد القرآني مع إعادة بدء اليوم والأيام المنجزة
  const setQuranType = useCallback(
    async (type) => {
      const typeInfo = WIRD_TYPES.find((t) => t.key === type) || WIRD_TYPES[0];
      const patch = {
        [QURAN_KEYS.type]: type,
        [QURAN_KEYS.day]: 1,
        [QURAN_KEYS.daysDone]: 0,
        [QURAN_KEYS.totalDays]: typeInfo.totalDays,
      };
      await update(patch);
    },
    [update]
  );

  // إكمال ورد اليوم: يحسب الحماسة ويعرض اليوم التالي تلقائيًا
  const completeQuranWird = useCallback(async () => {
    const todayStart = startOfDay(Date.now());
    const lastCompleted = settings[QURAN_KEYS.lastCompleted];
    if (lastCompleted === todayStart) return true; // أُنجز اليوم بالفعل

    const streak = nextStreak(settings[QURAN_KEYS.streak] || 0, lastCompleted, todayStart, MS_PER_DAY);
    const next = nextDayState({
      type: settings[QURAN_KEYS.type] || DEFAULTS[QURAN_KEYS.type],
      day: settings[QURAN_KEYS.day] || 1,
      daysDone: settings[QURAN_KEYS.daysDone] || 0,
    });

    const patch = {
      [QURAN_KEYS.streak]: streak,
      [QURAN_KEYS.day]: next.day,
      [QURAN_KEYS.daysDone]: next.daysDone,
      [QURAN_KEYS.lastCompleted]: todayStart,
    };
    await update(patch);
    return true;
  }, [settings, update]);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        notificationsSupportedFlag,
        update,
        enableNotifications,
        disableNotifications,
        goToNotificationSettings,
        setQuranType,
        completeQuranWird,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext يجب استخدامه داخل SettingsProvider');
  return ctx;
}