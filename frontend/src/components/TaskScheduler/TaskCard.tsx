import React, { useState, useCallback, memo, useEffect } from 'react';
import { Bell, BellRing, MoreVertical, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useReminderChecker } from '@/hooks/useReminderChecker';

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

  // Initialize reminder checker
  useReminderChecker([task]);

  useEffect(() => {
    console.log("Task reminder data:", task.reminder);
  }, [task.reminder]);

  const handleStatusChange = useCallback(() => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    onUpdateTask({ ...task, status: newStatus });
  }, [task, onUpdateTask]);

  const handleReminderSuccess = useCallback(async (updatedTask: Task) => {
    console.log("Handling reminder success with task:", updatedTask);
    setShowReminderDialog(false);
    await onUpdateTask(updatedTask);
  }, [onUpdateTask]);

  const handleReminderClose = useCallback(() => {
    setShowReminderDialog(false);
  }, []);

  const handleReminderClick = useCallback(() => {
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

  const getReminderStatus = useCallback(() => {
    if (!task.reminder) return null;

    const now = new Date();
    const reminderTime = task.reminder.time instanceof Date 
      ? task.reminder.time 
      : new Date(task.reminder.time.seconds * 1000);

    if (reminderTime < now) {
      return task.reminder.notificationSent ? 'triggered' : 'overdue';
    }
    
    // Calculate time until reminder
    const diff = reminderTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d`;
    if (hours > 0) return `in ${hours}h`;
    if (minutes > 0) return `in ${minutes}m`;
    return 'now';
  }, [task.reminder]);

  const getReminderLabel = useCallback(() => {
    if (!task.reminder) return null;

    const time = formatReminderTime(task.reminder.time);
    const status = getReminderStatus();
    
    if (!task.reminder.recurring) {
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{time}</span>
          <Badge variant={
            status === 'triggered' ? 'secondary' :
            status === 'overdue' ? 'destructive' : 'default'
          }>
            {status}
          </Badge>
        </div>
      );
    }

    const { frequency, interval } = task.reminder.recurring;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{time}</span>
          <Badge variant={
            status === 'triggered' ? 'secondary' :
            status === 'overdue' ? 'destructive' : 'default'
          }>
            {status}
          </Badge>
        </div>
        <Badge variant="outline" className="w-fit">
          Repeats {frequency} (every {interval} {frequency.slice(0, -2)}{interval > 1 ? 's' : ''})
        </Badge>
      </div>
    );
  }, [task.reminder, formatReminderTime, getReminderStatus]);

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
            <div className="mt-2 text-xs text-gray-400">
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
          onUpdateTask={onUpdateTask}
        />
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export { TaskCard };
