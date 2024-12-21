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

  private static async findTaskByDescription(searchTerms: string[]): Promise<Task | null> {
    try {
      const tasks = await getTasks();
      if (!tasks || tasks.length === 0) return null;

      // Convert search terms to lowercase for case-insensitive matching
      const lowerSearchTerms = searchTerms.map(term => term.toLowerCase());
      
      // Find task that matches the most search terms
      let bestMatch: Task | null = null;
      let maxMatchCount = 0;

      for (const task of tasks) {
        if (!task || !task.title) continue;
        
        const taskTitle = task.title.toLowerCase();
        const matchCount = lowerSearchTerms.filter(term => taskTitle.includes(term)).length;
        
        if (matchCount > maxMatchCount) {
          maxMatchCount = matchCount;
          bestMatch = task;
        }
      }

      // Only return a match if it matches at least one search term
      return maxMatchCount > 0 ? bestMatch : null;
    } catch (error) {
      console.error('Find task error:', error);
      return null;
    }
  }

  private static async deleteTask(taskId: string | { description: string }): Promise<CommandResult> {
    try {
      let targetTaskId: string | undefined;

      if (typeof taskId === 'string') {
        targetTaskId = taskId;
      } else {
        // Extract key terms from the description
        const searchTerms = taskId.description
          .toLowerCase()
          .replace(/delete|remove|cancel/g, '')
          .split(' ')
          .filter(term => term.length > 2); // Filter out short words

        const task = await this.findTaskByDescription(searchTerms);
        if (!task) {
          return {
            success: false,
            message: "I couldn't find a task matching that description. Please try being more specific or use 'show tasks' to see your task list."
          };
        }
        targetTaskId = task.id;
      }

      // Check if we have a valid task ID
      if (!targetTaskId) {
        return {
          success: false,
          message: "No valid task ID found for deletion."
        };
      }

      await deleteTask(targetTaskId);
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
      
      if (tasks.length === 0) {
        return {
          success: true,
          message: "You don't have any tasks.",
          data: tasks
        };
      }

      const taskList = tasks.map((task: Task) => {
        const dueText = task.dueDate ? 
          ` (Due: ${task.dueDate.toLocaleString()}${new Date(task.dueDate) < new Date() ? ' - OVERDUE' : ''})` : 
          ' (No due date)';
        
        return `- ${task.title}${dueText} - Status: ${task.status}`;
      }).join('\n');

      return {
        success: true,
        message: `Here are your tasks:\n${taskList}`,
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

  private static async listReminders(): Promise<CommandResult> {
    try {
      const response = await fetch('http://localhost:8000/api/reminders');
      const reminders = await response.json();
      
      if (!Array.isArray(reminders)) {
        throw new Error('Invalid response format');
      }

      if (reminders.length === 0) {
        return {
          success: true,
          message: "You don't have any reminders.",
          data: reminders
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

      const reminderList = reminders.map((reminder: any) => {
        const dueText = reminder.reminder_time ? 
          ` (Due: ${formatDate(reminder.reminder_time)}${reminder.is_due ? ' - OVERDUE' : ''})` : 
          ' (No due date)';
        
        return `- ${reminder.task}${dueText}`;
      }).join('\n');

      return {
        success: true,
        message: `Here are your reminders:\n${reminderList}`,
        data: reminders
      };
    } catch (error) {
      console.error('List reminders error:', error);
      return {
        success: false,
        message: 'Failed to fetch reminders'
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
5. List reminders: "show reminders" or "list reminders"
6. Help: "help" or "show commands"

Example:
- create task Buy groceries
- show tasks
- show reminders
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
      console.log("tasks is lited");
      return this.listTasks();
    }

    if (lowercaseInput === 'show reminders' || lowercaseInput === 'list reminders') {
      console.log("reminder is listed");
      return this.listReminders();
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

        case 'list_reminders':
          return this.listReminders();
          
        case 'delete_task':
          if (!result.data) {
            return {
              success: false,
              message: "Missing data for delete task operation"
            };
          }
          
          if (result.data.taskId) {
            return this.deleteTask(result.data.taskId);
          } else if (result.data.description) {
            return this.deleteTask({ description: result.data.description });
          } else {
            return {
              success: false,
              message: "I couldn't determine which task to delete. Please try being more specific."
            };
          }
          
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
