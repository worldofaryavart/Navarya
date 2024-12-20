import { Task, NewTaskInput } from '@/types/taskTypes';
import { addTask, deleteTask, getTasks, updateTask } from './tasks';

export type CommandType = 
  | 'CREATE_TASK'
  | 'DELETE_TASK'
  | 'UPDATE_TASK'
  | 'LIST_TASKS'
  | 'HELP'
  | 'UNKNOWN';

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export class AICommandHandler {
  private static async createTask(content: string): Promise<CommandResult> {
    try {
      const newTask: NewTaskInput = {
        title: content,
        description: '',
        priority: 'Medium',
        dueDate: null
      };
      
      const task = await addTask(newTask);
      return {
        success: true,
        message: `Created task: ${content}`,
        data: task
      };
    } catch (error) {
      console.error('Create task error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        message: `Failed to create task: ${errorMessage}`
      };
    }
  }

  private static async deleteTask(taskId: string): Promise<CommandResult> {
    try {
      await deleteTask(taskId);
      return {
        success: true,
        message: `Task deleted successfully`
      };
    } catch (error) {
      console.error('Delete task error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        message: `Failed to delete task: ${errorMessage}`
      };
    }
  }

  private static async updateTask(taskId: string, updates: Partial<Task>): Promise<CommandResult> {
    try {
      const existingTask = await getTasks();
      const task = existingTask.find(t => t.id === taskId);
      
      if (!task) {
        return {
          success: false,
          message: `Task with ID ${taskId} not found`
        };
      }

      // Validate status if it's being updated
      if (updates.status) {
        const validStatuses = ['Pending', 'In Progress', 'Completed'];
        if (!validStatuses.includes(updates.status)) {
          updates.status = 'Pending';
        }
      }

      const updatedTask = await updateTask({ ...task, ...updates });
      return {
        success: true,
        message: `Task updated successfully`,
        data: updatedTask
      };
    } catch (error) {
      console.error('Update task error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        message: `Failed to update task: ${errorMessage}`
      };
    }
  }

  private static async listTasks(): Promise<CommandResult> {
    try {
      const response = await fetch('http://localhost:8000/api/reminders');
      const tasks = await response.json();
      
      if (!Array.isArray(tasks)) {
        throw new Error('Invalid response format');
      }

      if (tasks.length === 0) {
        return {
          success: true,
          message: "You don't have any pending tasks.",
          data: tasks
        };
      }

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === now.toDateString()) {
          return `today at ${date.toLocaleTimeString()}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
          return `tomorrow at ${date.toLocaleTimeString()}`;
        } else {
          return date.toLocaleString();
        }
      };

      const taskList = tasks.map((task: any) => {
        const dueText = task.reminder_time ? 
          ` (Due: ${formatDate(task.reminder_time)}${task.is_due ? ' - OVERDUE' : ''})` : 
          ' (No due date)';
        
        return `- ${task.task}${dueText}`;
      }).join('\n');

      return {
        success: true,
        message: `Here are your pending tasks:\n${taskList}`,
        data: tasks
      };
    } catch (error) {
      console.error('List tasks error:', error);
      return {
        success: false,
        message: 'Failed to fetch tasks'
      };
    }
  }

  private static getHelpMessage(): CommandResult {
    return {
      success: true,
      message: `
Available commands:
1. Create a task: "create task [task description]"
2. Delete a task: "delete task [task id]"
3. Update task status: "update task [task id] status [Pending/In Progress/Completed]"
4. List tasks: "show tasks" or "list tasks"
5. Help: "help" or "show commands"

Example:
- create task Buy groceries
- show tasks
- update task abc123 status In Progress
- delete task abc123
      `.trim()
    };
  }

  public static async processCommand(input: string): Promise<CommandResult> {
    const lowercaseInput = input.toLowerCase();

    // Direct commands that don't need AI processing
    if (lowercaseInput === 'help' || lowercaseInput === 'show commands') {
      return this.getHelpMessage();
    }

    if (lowercaseInput === 'show tasks' || lowercaseInput === 'list tasks') {
      return this.listTasks();
    }

    try {
      console.log("Sending request with input:", input);
      
      // Send all other commands to AI processor
      const aiResponse = await fetch('http://localhost:8000/api/process-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: input })
      });

      const result = await aiResponse.json();
      console.log("AI Response:", result);

      if (!aiResponse.ok) {
        console.error("API Error:", result);
        return {
          success: false,
          message: result.detail || "Failed to process the command. Please try again."
        };
      }
      
      if (!result.success) {
        return {
          success: false,
          message: result.message || "I couldn't understand that command. Try rephrasing or type 'help' to see available commands."
        };
      }

      // Handle different actions based on AI response
      switch (result.action) {
        case 'create_task': {
          console.log("Creating task with data:", result.data);
          const newTask: NewTaskInput = {
            title: result.data.title,
            description: result.data.description || '',
            priority: result.data.priority || 'Medium',
            dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null
          };
          
          const task = await addTask(newTask);
          return {
            success: true,
            message: `Created task: ${newTask.title}${newTask.dueDate ? ` (Due: ${newTask.dueDate.toLocaleString()})` : ''}`,
            data: task
          };
        }
          
        case 'list_tasks':
          return this.listTasks();
          
        case 'delete_task':
          return this.deleteTask(result.data.taskId);
          
        case 'update_task':
          return this.updateTask(result.data.taskId, result.data.updates);
          
        default:
          console.log("Unknown action:", result.action);
          return {
            success: false,
            message: "I couldn't understand that command. Try rephrasing or type 'help' to see available commands."
          };
      }
    } catch (error) {
      console.error('Command processing error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error processing your command. Please try again.'
      };
    }
  }
}
