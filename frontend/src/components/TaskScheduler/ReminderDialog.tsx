import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { formatDateForInput, formatDateToDisplay, parseDateFromDisplay } from "@/utils/dateUtils";

interface ReminderDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: Task) => void;
  onUpdateTask: (task: Task) => void;
}

const ReminderDialog = ({ task, open, onClose, onSuccess, onUpdateTask }: ReminderDialogProps) => {
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
        reminderTime: formatDateForInput(time),
        isRecurring: !!task.reminder.recurring,
        frequency: task.reminder.recurring?.frequency || 'daily',
        interval: task.reminder.recurring?.interval || 1,
        endDate: task.reminder.recurring?.endDate
          ? formatDateForInput(task.reminder.recurring.endDate instanceof Date
            ? task.reminder.recurring.endDate
            : new Date(task.reminder.recurring.endDate.seconds * 1000)
          )
          : '',
      });
    } else {
      // Set default reminder time to current time + 30 minutes
      const defaultTime = new Date();
      defaultTime.setMinutes(defaultTime.getMinutes() + 30);
      setFormState({
        reminderTime: formatDateForInput(defaultTime),
        isRecurring: false,
        frequency: 'daily',
        interval: 1,
        endDate: '',
      });
    }
  }, [task.reminder]);

  const formatTimeUntilReminder = useCallback((reminderTime: string) => {
    if (!reminderTime) return '';

    const now = new Date();
    const reminder = parseDateFromDisplay(reminderTime);
    const diff = reminder.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} from now`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} from now`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} from now`;
    return 'now';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Submitting reminder with form state:", formState);
      
      // Convert the reminder time to a Date object
      const reminderDate = parseDateFromDisplay(formState.reminderTime);
      
      let recurring = undefined;
      if (formState.isRecurring && formState.frequency !== 'once') {
        recurring = {
          frequency: formState.frequency as 'daily' | 'weekly' | 'monthly',
          interval: formState.interval
        };
      }

      // Create the reminder data
      const reminderData = {
        time: {
          seconds: Math.floor(reminderDate.getTime() / 1000),
          nanoseconds: 0
        },
        notificationSent: false,
        ...(recurring && { recurring })
      };

      console.log("Sending reminder data:", reminderData);

      // Add the reminder
      const response = await addReminder(task.id, reminderDate, recurring);
      console.log("Received response:", response);

      // Update the task with the new reminder
      const updatedTask = {
        ...task,
        reminder: {
          time: response.time,
          notificationSent: response.notificationSent,
          ...(recurring && { recurring })
        }
      };
      console.log("Updating task with:", updatedTask);

      onSuccess(updatedTask);
    } catch (error) {
      console.error("Error setting reminder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeReminder(task.id);
      // Update the task with reminder set to undefined
      onSuccess({ ...task, reminder: undefined });
    } catch (error) {
      console.error('Error removing reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
          <DialogDescription className="text-gray-400">
            Set a reminder for task: <span className="text-gray-300">{task.title}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reminderTime">Reminder Time</Label>
              <Input
                id="reminderTime"
                type="datetime-local"
                value={formState.reminderTime}
                onChange={(e) => setFormState(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="bg-gray-700 border-gray-600"
              />
              {formState.reminderTime && (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatTimeUntilReminder(formState.reminderTime)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="recurring">Recurring Reminder</Label>
              <Switch
                id="recurring"
                checked={formState.isRecurring}
                onCheckedChange={(checked) => setFormState(prev => ({ ...prev, isRecurring: checked }))}
              />
            </div>

            {formState.isRecurring && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formState.frequency}
                    onValueChange={(value: ReminderFrequency) => 
                      setFormState(prev => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Repeat every</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      value={formState.interval}
                      onChange={(e) => setFormState(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                      className="bg-gray-700 border-gray-600 w-20"
                    />
                    <span className="text-gray-400">
                      {formState.frequency.slice(0, -2)}{formState.interval > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formState.endDate}
                    onChange={(e) => setFormState(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            {task.reminder && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                disabled={loading}
              >
                Remove Reminder
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !formState.reminderTime}
            >
              {loading ? 'Saving...' : 'Save Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
