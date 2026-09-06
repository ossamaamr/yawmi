// ══════════════════════════════════════════════════════════
// context/SettingsContext.jsx — الإعدادات (الثيم، الخط، الإشعارات)
// تُحفظ في IndexedDB وتُطبّق مباشرة على جذر الصفحة.
// ══════════════════════════════════════════════════════════
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSetting, setSetting } from '../lib/db';
import {
  requestNotificationPermission,
  notificationsSupported,
  cancelAllNotifications,
} from '../lib/notifications';

const SettingsContext = createContext(null);

const DEFAULTS = {
  theme: 'light', // light | dark | system
  palette: 'default', // default | olive | royal | rose | amber | plum
  fontSize: 'normal', // normal | large
  notificationsEnabled: false,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ ...DEFAULTS, loaded: false });
  const [notificationsSupportedFlag, setNotificationsSupportedFlag] = useState(true);

  useEffect(() => {
    (async () => {
      const theme = await getSetting('theme', DEFAULTS.theme);
      const palette = await getSetting('palette', DEFAULTS.palette);
      const fontSize = await getSetting('fontSize', DEFAULTS.fontSize);
      const notificationsEnabled = await getSetting('notificationsEnabled', false);
      setSettings({ ...DEFAULTS, theme, palette, fontSize, notificationsEnabled, loaded: true });

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

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        notificationsSupportedFlag,
        update,
        enableNotifications,
        disableNotifications,
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