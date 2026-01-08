import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false })
});

export async function requestPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    return false;
  }
}

export async function scheduleDailyReminder(hour = 18, minute = 0) {
  // Cancel previously scheduled reminders (simple approach)
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of existing) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  } catch (e) {}

  const trigger = {
    hour,
    minute,
    repeats: true
  };
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'LiftBuildr Reminder', body: "Time for your workout — keep consistency!" },
      trigger
    });
    return id;
  } catch (e) {
    return null;
  }
}

export async function cancelAllReminders() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (e) {}
}
