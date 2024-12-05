import ReminderService from "@/services/ReminderService";
import { Task } from "@/types/taskTypes";
import { useEffect, useState } from "react";

export const useReminderSystem = (tasks: Task[]) => {
    const [reminderService] = useState(() => new ReminderService());

    useEffect(() => {
        if ('Notification' in window) {
            Notification.requestPermission();
        }

        tasks.forEach(task => reminderService.createReminder(task));

        const reminderInterval = setInterval(() => {
            reminderService.checkReminders();
        }, 60000);

        return () => clearInterval(reminderInterval);
    }, [tasks, reminderService]);

    return reminderService;
}