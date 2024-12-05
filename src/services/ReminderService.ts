import * as chrono from 'chrono-node';
import { Task } from "@/types/taskTypes";
import { Reminder } from '@/types/reminder';
import { permission } from 'process';
import { useEffect } from 'react';

class ReminderService {
    private reminders: Reminder[] = [];

    extractReminderTime(task: Task): Date | null {
        const searchText = `${task.title} ${task.description || ''}`;

        try {
            const parsedResults = chrono.parse(searchText);

            if ( parsedResults.length > 0 ) {
                const parsedDate = parsedResults[0].start.date();

                if (parsedDate > new Date()) {
                    return parsedDate;
                }
            }
        } catch (error) {
            console.error('Error parsing reminder time: ', error);
        }

        return null;
    }

    createReminder(task: Task): Reminder | null {
        const reminderTime = this.extractReminderTime(task);

        if (reminderTime) {
            const reminder: Reminder = {
                id: `reminder_${task.id}`,
                taskId: task.id, 
                reminderTime,
                title: task.title,
                description: task.description
            };

            this.reminders.push(reminder);
            return reminder;
        }

        return null;
    }

    checkReminders() {
        const now = new Date();

        this.reminders.forEach(reminder => {
            if (
                reminder.reminderTime <= now &&
                reminder.reminderTime > new Date(now.getTime() - 5*60000)
            ) {
                this.triggerReminder(reminder);
            }
        });
    }

    private triggerReminder(reminder: Reminder) {
        if (typeof window !== 'undefined') {
            if ('Notification' in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(reminder.title, {
                            body: `Reminder: ${reminder.description || 'No additional details'}`,
                            // icon: '/path/to/icon/png'
                        });
                    }
                });
            }
        }

        console.log(`Reminder triggered: ${reminder.title} at ${reminder.reminderTime}`);
    }

    getReminders(): Reminder[] {
        return this.reminders;
    }
}

export default ReminderService;