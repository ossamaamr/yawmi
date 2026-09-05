import * as Notifications from 'expo-notifications';

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleReminder(options: {
  title: string;
  body: string;
  scheduledTime: number;
  data?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const secondsUntil = Math.floor((options.scheduledTime - Date.now()) / 1000);
    if (secondsUntil <= 0) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data ?? {},
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
      },
    });

    return id;
  } catch {
    return null;
  }
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of notifications) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  } catch {
    // ignore
  }
}
