"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { moonriseMessage, readReminders, reminderEvent, saveReminders } from "~/lib/moon-reminders";

export function MoonAlertScheduler() {
  useEffect(() => {
    const check = () => {
      const reminders = readReminders(),
        now = new Date();
      const due = reminders.filter(
        (item) =>
          !item.sent &&
          Date.parse(item.alertAt) <= now.getTime() &&
          Date.parse(item.riseAt) > now.getTime() - 3600000,
      );
      if (!due.length) return;
      try {
        saveReminders(
          reminders.map((item) =>
            due.some((d) => d.id === item.id) ? { ...item, sent: true } : item,
          ),
        );
      } catch {
        return;
      }
      due.forEach((item) =>
        toast(moonriseMessage(new Date(item.riseAt), now, item.timeZone), {
          description: item.locationName,
          duration: 15000,
        }),
      );
    };
    check();
    const timer = window.setInterval(check, 15000);
    window.addEventListener(reminderEvent, check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener(reminderEvent, check);
      window.removeEventListener("focus", check);
    };
  }, []);
  return null;
}
