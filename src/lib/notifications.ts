import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Bill } from "@/lib/types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("bill-reminders", {
      name: "Reminder Tagihan",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }
  return status === "granted";
}

/**
 * Cancel all bill-* identifiers and re-schedule for currently active bills.
 * For each bill, schedule:
 *  - H-1 reminder at 09:00
 *  - H-day reminder at 09:00
 * Recurring monthly via calendar trigger.
 */
export async function rescheduleBillReminders(bills: Bill[]): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (typeof n.identifier === "string" && n.identifier.startsWith("bill-")) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  for (const b of bills) {
    if (!b.active) continue;

    const dueDay = clampDay(b.dueDay);
    const h1Day = previousDay(dueDay);

    await scheduleMonthlyAt(`bill-${b.id}-h1`, h1Day, 9, 0, {
      title: `Besok jatuh tempo: ${b.name}`,
      body: `Rp ${formatRupiah(b.amount)} — siapkan saldo dompet ya.`,
      data: { billId: b.id, kind: "h-1" },
    });

    await scheduleMonthlyAt(`bill-${b.id}-h0`, dueDay, 9, 0, {
      title: `Hari ini: bayar ${b.name}`,
      body: `Rp ${formatRupiah(b.amount)} jatuh tempo hari ini.`,
      data: { billId: b.id, kind: "h-0" },
    });
  }
}

async function scheduleMonthlyAt(
  identifier: string,
  day: number,
  hour: number,
  minute: number,
  content: Notifications.NotificationContentInput,
) {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      ...content,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day,
      hour,
      minute,
      repeats: true,
      channelId: "bill-reminders",
    },
  });
}

function clampDay(d: number): number {
  if (Number.isNaN(d)) return 1;
  return Math.min(28, Math.max(1, Math.round(d)));
}

function previousDay(d: number): number {
  const prev = d - 1;
  return prev < 1 ? 28 : prev;
}

function formatRupiah(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export async function cancelAllBillReminders() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    if (n.identifier.startsWith("bill-")) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
