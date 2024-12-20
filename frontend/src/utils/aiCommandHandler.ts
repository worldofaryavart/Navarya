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
      // Extract date and time information using regex
      const dateTimeRegex = /tomorrow at (\d{1,2}(?::\d{2})?\s*(?:am|pm)|today at \d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}\/\d{1,2}(?:\/\d{4})?\s*(?:at\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?)/i;
      const match = content.match(dateTimeRegex);
      
      let dueDate: Date | null = null;
      let title = content;

      if (match) {
        const dateStr = match[0];
        title = content.replace(dateStr, '').trim();
        
        // Parse the date
        const now = new Date();
        if (dateStr.toLowerCase().includes('tomorrow')) {
          dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + 1);
          
          // Extract time
          const timeMatch = dateStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const period = timeMatch[3].toLowerCase();
            
            if (period === 'pm' && hours < 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
            
            dueDate.setHours(hours, minutes, 0, 0);
          }
        }
      }

      const newTask: NewTaskInput = {
        title,
        description: '',
        priority: 'Medium',
        dueDate: dueDate || null,
      };
      
      const task = await addTask(newTask);
      return {
        success: true,
        message: `Created task: ${title}${dueDate ? ` (Due: ${dueDate.toLocaleString()})` : ''}`,
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
      const tasks = await getTasks();
      const taskList = tasks.map(task => 
        `• ${task.title} (${task.status}) [ID: ${task.id}]`
      ).join('\n');
      
      return {
        success: true,
        message: tasks.length > 0 
          ? `Current tasks:\n${taskList}`
          : 'No tasks found',
        data: tasks
      };
    } catch (error) {
      console.error('List tasks error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to list tasks: ${errorMessage}`
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
    const lowercaseInput = input.toLowerCase().trim();

    // Help command
    if (lowercaseInput === 'help' || lowercaseInput === 'show commands') {
      return this.getHelpMessage();
    }

    // List tasks
    if (lowercaseInput === 'list tasks' || lowercaseInput === 'show tasks') {
      return this.listTasks();
    }

    // Create task
    if (lowercaseInput.startsWith('create task')) {
      const taskContent = input.slice('create task'.length).trim();
      if (!taskContent) {
        return { success: false, message: 'Please provide task description' };
      }
      return this.createTask(taskContent);
    }

    // Delete task
    if (lowercaseInput.startsWith('delete task')) {
      const taskId = input.slice('delete task'.length).trim();
      if (!taskId) {
        return { success: false, message: 'Please provide task ID' };
      }
      return this.deleteTask(taskId);
    }

    // Update task
    if (lowercaseInput.startsWith('update task')) {
      const parts = input.slice('update task'.length).trim().split(' ');
      if (parts.length < 3) {
        return { success: false, message: 'Invalid update format. Use: update task [id] status [Pending/In Progress/Completed]' };
      }
      const [taskId, field, ...valueArr] = parts;
      const value = valueArr.join(' ');
      return this.updateTask(taskId, { [field]: value });
    }

    return {
      success: false,
      message: "I don't understand that command. Type 'help' to see available commands."
    };
  }
}
