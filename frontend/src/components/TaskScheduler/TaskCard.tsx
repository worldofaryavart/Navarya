import React, { useState } from 'react';
import { Bell, BellRing, MoreVertical, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { Task } from '@/types/taskTypes';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Dynamic import of ReminderDialog
const ReminderDialog = dynamic(() => import('./ReminderDialog'), {
  ssr: false,
});

interface TaskCardProps {
  task: Task;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

export const TaskCard = ({
  task,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
}: TaskCardProps) => {
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  const handleStatusChange = () => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    onUpdateTask({ ...task, status: newStatus });
  };

  const handleReminderSuccess = () => {
    // Refresh task data
    onUpdateTask(task);
  };

  const formatReminderTime = (time: Date | { seconds: number }) => {
    if (typeof window === 'undefined') return '';
    
    const date = time instanceof Date ? time : new Date(time.seconds * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getReminderLabel = () => {
    if (!task.reminder) return null;

    const time = formatReminderTime(task.reminder.time);
    if (!task.reminder.recurring) return `Reminder at ${time}`;

    const { frequency, interval } = task.reminder.recurring;
    return `Repeats ${frequency} (every ${interval} ${frequency.slice(0, -2)}${interval > 1 ? 's' : ''})`;
  };

  return (
    <>
      <div className={cn(
        'flex items-center justify-between p-4 rounded-lg border',
        task.status === 'Completed' ? 'bg-gray-50' : 'bg-white',
        task.priority === 'High' ? 'border-red-200' :
        task.priority === 'Medium' ? 'border-yellow-200' : 'border-green-200'
      )}>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStatusChange}
            className={cn(
              'hover:bg-transparent',
              task.status === 'Completed' ? 'text-green-500' : 'text-gray-400'
            )}
          >
            <CheckCircle className="h-5 w-5" />
          </Button>

          <div>
            <h3 className={cn(
              'font-medium',
              task.status === 'Completed' && 'line-through text-gray-500'
            )}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-500">{task.description}</p>
            )}
            {task.reminder && (
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <BellRing className="h-3 w-3 mr-1" />
                {getReminderLabel()}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReminderDialog(true)}
            className={cn(
              'hover:bg-transparent',
              task.reminder ? 'text-blue-500' : 'text-gray-400'
            )}
          >
            {task.reminder ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditTask(task)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDeleteTask(task.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showReminderDialog && (
        <ReminderDialog
          task={task}
          open={showReminderDialog}
          onClose={() => setShowReminderDialog(false)}
          onSuccess={handleReminderSuccess}
        />
      )}
    </>
  );
};
