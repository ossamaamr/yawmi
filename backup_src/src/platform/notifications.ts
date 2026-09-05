import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleTaskNotification(
  taskId: string,
  title: string,
  body: string,
  timestamp: number
): Promise<string> {
  const granted = await requestPermissions();
  if (!granted) return "";

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { taskId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(timestamp),
      channelId: "yawmi-tasks",
    },
  });

  return id;
}

export async function cancelNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function setupNotificationHandler(): void {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("yawmi-tasks", {
      name: "مهام يومي",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  Notifications.addNotificationReceivedListener(() => {});

  Notifications.addNotificationResponseReceivedListener(() => {});
}
