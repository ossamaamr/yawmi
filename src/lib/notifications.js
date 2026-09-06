// ══════════════════════════════════════════════════════════
// lib/notifications.js — الإشعارات المحلية (Capacitor Local Notifications)
// بدون أي خادم خارجي. تُجدول محليًا وتُلغى عند حذف المهمة.
// يدعم طلب الإذن الصحيح على أندرويد ١٣+، ويتيح فتح إعدادات النظام
// عند رفض المستخدم حتى يفعّل الإشعارات بنفسه.
// على الويب (Web) نكتفي بإشعار عبر المتصفح عند الطلب، إن توفر.
// ══════════════════════════════════════════════════════════
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

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

// طلب الصلاحية بالطريقة الرسمية (مهم على أندرويد 13+)
export async function requestNotificationPermission() {
  if (isNative()) {
    try {
      nativeAvailable = true;
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted' || result.display === 'limited';
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

// فتح إعدادات النظام الخاصة بالإشعارات: يعيد المستخدم إلى شاشة
// إشعارات التطبيق حتى يفعّلها يدويًا إن كان رفضها سابقًا.
export async function openSystemNotificationSettings() {
  if (!isNative()) return false;
  try {
    const result = await NativeSettings.open({
      optionAndroid: AndroidSettings.AppNotification,
      optionIOS: IOSSettings.App,
    });
    return result.status;
  } catch {
    return false;
  }
}

// جدولة إشعار عند زمن محدد (بالمللي ثانية)
// sound: اختياري — اسم مورد صوتي (Android) أو المسار المختار من الجهاز.
export async function scheduleNotification({ id, title, body, at, sound }) {
  const fireAt = new Date(at);
  if (!(fireAt.getTime() > Date.now())) return null;

  if (isNative() && nativeAvailable) {
    const notification =
      sound && typeof sound === 'string' && sound.length > 0
        ? { id, title, body, schedule: { at: fireAt }, sound }
        : { id, title, body, schedule: { at: fireAt } };
    try {
      await LocalNotifications.schedule({
        notifications: [notification],
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