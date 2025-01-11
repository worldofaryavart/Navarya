import React, { useState, useCallback, memo } from 'react';
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
import ReminderDialog from './ReminderDialog';

interface TaskCardProps {
  task: Task;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

const TaskCard = memo(({
  task,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
}: TaskCardProps) => {
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  const handleStatusChange = useCallback(() => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    onUpdateTask({ ...task, status: newStatus });
  }, [task, onUpdateTask]);

  const handleReminderSuccess = useCallback(() => {
    setShowReminderDialog(false);
  }, []);

  const handleReminderClose = useCallback(() => {
    setShowReminderDialog(false);
  }, []);

  const handleReminderClick = useCallback(() => {
    console.log("reminder click is clicked");
    setShowReminderDialog(true);
  }, []);

  const formatReminderTime = useCallback((time: Date | { seconds: number }) => {
    if (typeof window === 'undefined') return '';
    
    const date = time instanceof Date ? time : new Date(time.seconds * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, []);

  const getReminderLabel = useCallback(() => {
    if (!task.reminder) return null;

    const time = formatReminderTime(task.reminder.time);
    if (!task.reminder.recurring) return `Reminder at ${time}`;

    const { frequency, interval } = task.reminder.recurring;
    return `Repeats ${frequency} (every ${interval} ${frequency.slice(0, -2)}${interval > 1 ? 's' : ''})`;
  }, [task.reminder, formatReminderTime]);

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg border',
      'dark bg-gray-800 text-gray-100',
      task.status === 'Completed' ? 'bg-gray-900/50' : 'bg-gray-800',
      task.priority === 'High' ? 'border-red-500/50' :
      task.priority === 'Medium' ? 'border-yellow-500/50' : 'border-green-500/50'
    )}>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStatusChange}
          className={cn(
            'hover:bg-gray-700/50',
            task.status === 'Completed' ? 'text-green-400' : 'text-gray-400'
          )}
        >
          <CheckCircle className="h-5 w-5" />
        </Button>

        <div>
          <h3 className={cn(
            'font-medium text-gray-100',
            task.status === 'Completed' && 'line-through text-gray-400'
          )}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-400">{task.description}</p>
          )}
          {task.reminder && (
            <div className="flex items-center mt-1 text-xs text-gray-400">
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
          onClick={handleReminderClick}
          className={cn(
            'hover:bg-gray-700/50',
            task.reminder ? 'text-blue-400' : 'text-gray-400'
          )}
        >
          {task.reminder ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-gray-700/50">
              <MoreVertical className="h-5 w-5 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
            <DropdownMenuItem 
              onClick={() => onEditTask(task)}
              className="text-gray-100 focus:bg-gray-700 focus:text-gray-100"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-400 focus:bg-gray-700 focus:text-red-400"
              onClick={() => onDeleteTask(task.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showReminderDialog && typeof window !== 'undefined' && (
        <ReminderDialog
          key={`reminder-${task.id}-${showReminderDialog}`}
          task={task}
          open={showReminderDialog}
          onClose={handleReminderClose}
          onSuccess={handleReminderSuccess}
        />
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export { TaskCard };
