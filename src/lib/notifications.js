// ══════════════════════════════════════════════════════════
// lib/notifications.js — الإشعارات المحلية (Capacitor Local Notifications)
// بدون أي خادم خارجي. تُجدول محليًا وتُلغى عند حذف المهمة.
// على الويب (Web) نكتفي بإشعار عبر المتصفح عند الطلب، إن توفر.
// ══════════════════════════════════════════════════════════
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let nativeAvailable = false;
let webGranted = false;

function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function notificationsSupported() {
  if (isNative()) {
    try {
      const result = await LocalNotifications.checkPermissions();
      nativeAvailable = true;
      return result.display === 'granted';
    } catch {
      return false;
    }
  }
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
  if (isNative()) {
    try {
      nativeAvailable = true;
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch {
      return false;
    }
  }
  if (typeof Notification !== 'undefined') {
    const result = await Notification.requestPermission();
    webGranted = result === 'granted';
    return webGranted;
  }
  return false;
}

// جدولة إشعار عند زمن محدد (بالمللي ثانية)
export async function scheduleNotification({ id, title, body, at }) {
  const fireAt = new Date(at);
  if (!(fireAt.getTime() > Date.now())) return null;

  if (isNative() && nativeAvailable) {
    try {
      await LocalNotifications.schedule({
        notifications: [{ id, title, body, schedule: { at: fireAt } }],
      });
      return id;
    } catch {
      return null;
    }
  }

  if (typeof Notification !== 'undefined' && (Notification.permission === 'granted' || webGranted)) {
    const timeout = fireAt.getTime() - Date.now();
    setTimeout(() => {
      try {
        new Notification(title, { body });
      } catch {
        /* تجاهل */
      }
    }, timeout);
    return id;
  }

  return null;
}

export async function cancelNotification(id) {
  if (id == null) return;
  if (isNative() && nativeAvailable) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch {
      /* تجاهل */
    }
  }
}

export async function cancelAllNotifications() {
  if (isNative() && nativeAvailable) {
    try {
      await LocalNotifications.cancelAll();
    } catch {
      /* تجاهل */
    }
  }
}

// دمج زمن المهمة: يوم + ساعة:دقيقة → مللي ثانية
// تعيد null إذا مضى الوقت (تُعاد الجدولة لاحقًا عند الاستحقاق).
export function taskFireTime(dueDate, dueTime) {
  if (!dueTime) return null;
  const match = String(dueTime).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const dayStart = new Date(dueDate);
  dayStart.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
  return dayStart.getTime();
}