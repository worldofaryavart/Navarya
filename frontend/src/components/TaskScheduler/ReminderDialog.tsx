import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Task, ReminderFrequency } from '@/types/taskTypes';
import { useTaskReminders } from '@/hooks/useTaskReminders';

interface ReminderDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ReminderDialog = ({ task, open, onClose, onSuccess }: ReminderDialogProps) => {
  const { addReminder, removeReminder } = useTaskReminders([]);
  const [loading, setLoading] = useState(false);
  const [reminderTime, setReminderTime] = useState<string>(
    task.reminder?.time 
      ? new Date(task.reminder.time instanceof Date 
          ? task.reminder.time 
          : task.reminder.time.seconds * 1000
        ).toISOString().slice(0, 16)
      : ''
  );
  const [isRecurring, setIsRecurring] = useState(!!task.reminder?.recurring);
  const [frequency, setFrequency] = useState<ReminderFrequency>(
    task.reminder?.recurring?.frequency || 'daily'
  );
  const [interval, setInterval] = useState<number>(
    task.reminder?.recurring?.interval || 1
  );
  const [endDate, setEndDate] = useState<string>(
    task.reminder?.recurring?.endDate
      ? new Date(task.reminder.recurring.endDate instanceof Date 
          ? task.reminder.recurring.endDate 
          : task.reminder.recurring.endDate.seconds * 1000
        ).toISOString().slice(0, 16)
      : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!reminderTime) {
        if (task.reminder) {
          await removeReminder(task.id);
        }
      } else {
        const reminderData = {
          time: new Date(reminderTime),
          ...(isRecurring && {
            recurring: {
              frequency,
              interval,
              ...(endDate && { endDate: new Date(endDate) }),
            },
          }),
        };

        await addReminder(task.id, reminderData.time, reminderData.recurring);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Reminder for "{task.title}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminderTime">Reminder Time</Label>
            <Input
              id="reminderTime"
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
              id="recurring"
            />
            <Label htmlFor="recurring">Recurring Reminder</Label>
          </div>

          {isRecurring && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(value: ReminderFrequency) => setFrequency(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Interval</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Export with dynamic import to avoid SSR issues
export default dynamic(() => Promise.resolve(ReminderDialog), {
  ssr: false
});
