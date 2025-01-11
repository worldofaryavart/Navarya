import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/hooks/useAuth';

interface ReminderDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ReminderDialog = ({ task, open, onClose, onSuccess }: ReminderDialogProps) => {
  const { user } = useAuth();
  const { addReminder, removeReminder } = useTaskReminders();
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState({
    reminderTime: '',
    isRecurring: false,
    frequency: 'daily' as ReminderFrequency,
    interval: 1,
    endDate: '',
  });

  useEffect(() => {
    if (task.reminder?.time) {
      const time = task.reminder.time instanceof Date
        ? task.reminder.time
        : new Date(task.reminder.time.seconds * 1000);

      setFormState({
        reminderTime: time.toISOString().slice(0, 16),
        isRecurring: !!task.reminder.recurring,
        frequency: task.reminder.recurring?.frequency || 'daily',
        interval: task.reminder.recurring?.interval || 1,
        endDate: task.reminder.recurring?.endDate
          ? (task.reminder.recurring.endDate instanceof Date
            ? task.reminder.recurring.endDate
            : new Date(task.reminder.recurring.endDate.seconds * 1000)
          ).toISOString().slice(0, 16)
          : '',
      });
    } else {
      setFormState({
        reminderTime: '',
        isRecurring: false,
        frequency: 'daily',
        interval: 1,
        endDate: '',
      });
    }
  }, [task.reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    
    setLoading(true);

    try {
      console.log("formstate: ", formState);
      if (!formState.reminderTime) {
        if (task.reminder) {
          await removeReminder(task.id);
        }
      } else {
        const reminderData = {
          time: new Date(formState.reminderTime),
          ...(formState.isRecurring && formState.frequency !== 'once' && {
            recurring: {
              frequency: formState.frequency as 'daily' | 'weekly' | 'monthly',
              interval: formState.interval,
              ...(formState.endDate && { endDate: new Date(formState.endDate) }),
            },
          }),
        };

        await addReminder(task.id, reminderData.time, reminderData.recurring);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Set Reminder for "{task.title}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminderTime" className="text-gray-200">Reminder Time</Label>
            <Input
              id="reminderTime"
              type="datetime-local"
              value={formState.reminderTime}
              onChange={(e) => setFormState(prev => ({ ...prev, reminderTime: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formState.isRecurring}
              onCheckedChange={(checked) => setFormState(prev => ({ ...prev, isRecurring: checked }))}
              id="recurring"
              className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-blue-500"
            />
            <Label htmlFor="recurring" className="text-gray-200">Recurring Reminder</Label>
          </div>

          {formState.isRecurring && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency" className="text-gray-200">Frequency</Label>
                <Select
                  value={formState.frequency}
                  onValueChange={(value: ReminderFrequency) =>
                    setFormState(prev => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="daily" className="text-gray-100 focus:bg-gray-700">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-gray-100 focus:bg-gray-700">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-gray-100 focus:bg-gray-700">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval" className="text-gray-200">Interval</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  value={formState.interval}
                  onChange={(e) => setFormState(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                  className="bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-gray-200">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formState.endDate}
                  onChange={(e) => setFormState(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
              className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
