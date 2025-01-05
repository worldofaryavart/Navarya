import { Task, NewTaskInput, TaskStatus, TaskPriority } from '@/types/taskTypes';
import { addTask, deleteTask, getTasks, updateTask } from '@/utils/tasks/tasks';
import { getApiUrl } from '../config/api.config';

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
  private static async createTask(data: any): Promise<CommandResult> {
    try {
      const newTask: NewTaskInput = {
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'Medium',
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      };
      await addTask(newTask);
      return {
        success: true,
        message: data.message || `Task "${newTask.title}" created successfully`
      };
    } catch (error) {
      console.error('Create task error:', error);
      return {
        success: false,
        message: 'Failed to create task'
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

  private static async deleteTask(data: any): Promise<CommandResult> {
    try {
      const tasks = await getTasks();
      const taskToDelete = tasks.find(task => 
        task.title.toLowerCase().includes(data.description.toLowerCase())
      );

      if (!taskToDelete) {
        return {
          success: false,
          message: `No task found matching "${data.description}"`
        };
      }

      await deleteTask(taskToDelete.id);
      return {
        success: true,
        message: data.message || `Task "${taskToDelete.title}" deleted successfully`
      };
    } catch (error) {
      console.error('Delete task error:', error);
      return {
        success: false,
        message: 'Failed to delete task'
      };
    }
  }

  private static async updateTask(data: any): Promise<CommandResult> {
    try {
      const tasks = await getTasks();
      const taskToUpdate = tasks.find(task => 
        task.title.toLowerCase().includes(data.description.toLowerCase())
      );

      if (!taskToUpdate) {
        return {
          success: false,
          message: `No task found matching "${data.description}"`
        };
      }

      await updateTask({
        ...taskToUpdate,
        ...data.updates
      });
      return {
        success: true,
        message: data.message || `Task "${taskToUpdate.title}" updated successfully`
      };
    } catch (error) {
      console.error('Update task error:', error);
      return {
        success: false,
        message: 'Failed to update task'
      };
    }
  }

  private static async listTasks(filter?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    due?: 'today' | 'overdue' | 'upcoming';
    created?: 'today';
  }): Promise<CommandResult> {
    try {
      const tasks = await getTasks();
      
      if (tasks.length === 0) {
        return {
          success: true,
          message: "You don't have any tasks.",
          data: tasks
        };
      }

      let filteredTasks = [...tasks];
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      if (filter) {
        if (filter.status) {
          filteredTasks = filteredTasks.filter(task => task.status === filter.status);
        }
        if (filter.priority) {
          filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
        }
        if (filter.due) {
          switch (filter.due) {
            case 'today':
              filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate?.toString());
                return dueDate >= startOfDay && dueDate < endOfDay;
              });
              break;
            case 'overdue':
              filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate?.toString());
                return dueDate < startOfDay;
              });
              break;
            case 'upcoming':
              filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate?.toString());
                return dueDate >= startOfDay;
              });
              break;
          }
        }
        if (filter.created === 'today') {
          filteredTasks = filteredTasks.filter(task => {
            const createdDate = new Date(task.createdAt);
            return createdDate >= startOfDay && createdDate < endOfDay;
          });
        }
      }

      if (filteredTasks.length === 0) {
        let message = "No tasks found";
        if (filter?.status) message += ` with status '${filter.status}'`;
        if (filter?.priority) message += ` with priority '${filter.priority}'`;
        if (filter?.due) message += ` that are ${filter.due}`;
        if (filter?.created === 'today') message += " created today";
        return {
          success: true,
          message: message + ".",
          data: []
        };
      }

      const taskList = filteredTasks.map((task: Task) => {
        const dueText = task.dueDate ? 
          ` (Due: ${new Date(task.dueDate?.toString()).toLocaleString()}${new Date(task.dueDate?.toString()) < new Date() ? ' - OVERDUE' : ''})` : 
          ' (No due date)';
        
        return `- ${task.title}${dueText} - Status: ${task.status} - Priority: ${task.priority}`;
      }).join('\n');

      const countMessage = filteredTasks.length === 1 ? 
        "Found 1 task" : 
        `Found ${filteredTasks.length} tasks`;

      let filterDescription = "";
      if (filter?.status) filterDescription += ` with status '${filter.status}'`;
      if (filter?.priority) filterDescription += ` with priority '${filter.priority}'`;
      if (filter?.due) filterDescription += ` that are ${filter.due}`;
      if (filter?.created === 'today') filterDescription += " created today";

      return {
        success: true,
        message: `${countMessage}${filterDescription}:\n${taskList}`,
        data: filteredTasks
      };
    } catch (error) {
      console.error('List tasks error:', error);
      return {
        success: false,
        message: 'Failed to fetch tasks'
      };
    }
  }

  private static async listReminders(filter?: {
    status?: 'missed' | 'today' | 'upcoming' | 'completed';
    timeframe?: 'today' | 'tomorrow' | 'week';
  }): Promise<CommandResult> {
    try {
      const response = await fetch(getApiUrl('/api/reminders'));
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

      let filteredReminders = [...reminders];
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      const endOfTomorrow = new Date(endOfDay);
      endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
      const endOfWeek = new Date(startOfDay);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      if (filter) {
        if (filter.status) {
          switch (filter.status) {
            case 'missed':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime < now && !reminder.is_completed;
              });
              break;
            case 'today':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= startOfDay && reminderTime < endOfDay && !reminder.is_completed;
              });
              break;
            case 'upcoming':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= now && !reminder.is_completed;
              });
              break;
            case 'completed':
              filteredReminders = filteredReminders.filter(reminder => reminder.is_completed);
              break;
          }
        }

        if (filter.timeframe) {
          switch (filter.timeframe) {
            case 'today':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= startOfDay && reminderTime < endOfDay;
              });
              break;
            case 'tomorrow':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= endOfDay && reminderTime < endOfTomorrow;
              });
              break;
            case 'week':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= startOfDay && reminderTime < endOfWeek;
              });
              break;
          }
        }
      }

      if (filteredReminders.length === 0) {
        let message = "No reminders found";
        if (filter?.status) message += ` that are ${filter.status}`;
        if (filter?.timeframe) message += ` for ${filter.timeframe}`;
        return {
          success: true,
          message: message + ".",
          data: []
        };
      }

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = startOfDay;
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date < now) {
          return `${date.toLocaleString()} (Missed)`;
        } else if (date.toDateString() === today.toDateString()) {
          return `Today at ${date.toLocaleTimeString()}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
          return `Tomorrow at ${date.toLocaleTimeString()}`;
        } else {
          return date.toLocaleString();
        }
      };

      const reminderList = filteredReminders.map(reminder => {
        const status = reminder.is_completed ? "Completed" : 
                      new Date(reminder.reminder_time) < now ? "Missed" : 
                      "Pending";
        return `- ${reminder.task} (${formatDate(reminder.reminder_time)}) - Status: ${status}`;
      }).join('\n');

      const countMessage = filteredReminders.length === 1 ? 
        "Found 1 reminder" : 
        `Found ${filteredReminders.length} reminders`;

      let filterDescription = "";
      if (filter?.status) filterDescription += ` that are ${filter.status}`;
      if (filter?.timeframe) filterDescription += ` for ${filter.timeframe}`;

      return {
        success: true,
        message: `${countMessage}${filterDescription}:\n${reminderList}`,
        data: filteredReminders
      };
    } catch (error) {
      console.error('List reminders error:', error);
      return {
        success: false,
        message: 'Failed to fetch reminders'
      };
    }
  }

  private static async processBatchOperations(operations: any[]): Promise<CommandResult> {
    try {
      const results: { type: string; success: boolean; message: string }[] = [];
      
      for (const operation of operations) {
        let result;
        switch (operation.type) {
          case 'create_task':
            try {
              const newTask: NewTaskInput = {
                title: operation.data.title,
                description: operation.data.description || '',
                priority: operation.data.priority || 'Medium',
                dueDate: operation.data.dueDate ? new Date(operation.data.dueDate) : null
              };
              await addTask(newTask);
              results.push({
                type: 'create_task',
                success: true,
                message: `Created task: ${newTask.title}`
              });
            } catch (error) {
              results.push({
                type: 'create_task',
                success: false,
                message: `Failed to create task: ${operation.data.title}`
              });
            }
            break;

          case 'update_task':
            try {
              result = await this.updateTask({
                description: operation.data.description,
                updates: operation.data.updates
              });
              results.push({
                type: 'update_task',
                success: result.success,
                message: result.message
              });
            } catch (error) {
              results.push({
                type: 'update_task',
                success: false,
                message: `Failed to update task: ${operation.data.description}`
              });
            }
            break;

          case 'delete_task':
            try {
              result = await this.deleteTask({
                description: operation.data.description
              });
              results.push({
                type: 'delete_task',
                success: result.success,
                message: result.message
              });
            } catch (error) {
              results.push({
                type: 'delete_task',
                success: false,
                message: `Failed to delete task: ${operation.data.description}`
              });
            }
            break;
        }
      }

      // Generate summary message
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      let summaryMessage = `Completed ${successCount} out of ${results.length} operations:\n`;
      results.forEach(result => {
        const icon = result.success ? '✓' : '✗';
        summaryMessage += `${icon} ${result.message}\n`;
      });

      return {
        success: failureCount === 0,
        message: summaryMessage.trim(),
        data: results
      };
    } catch (error) {
      console.error('Batch operations error:', error);
      return {
        success: false,
        message: 'Failed to process batch operations'
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
      const aiResponse = await fetch(getApiUrl('/api/process-task'), {
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

      if (result.action === 'batch_operations' && result.data?.operations) {
        return this.processBatchOperations(result.data.operations);
      }

      if (result.action === 'conversation' && result.data?.response) {
        return {
          success: true,
          message: result.data.response
        };
      }

      if (result.action === 'list_tasks' && result.data?.filter) {
        return this.listTasks(result.data.filter);
      }

      if (result.action === 'list_reminders' && result.data?.filter) {
        return this.listReminders(result.data.filter);
      }

      // Handle different actions based on AI response
      switch (result.action) {
        case 'create_task': {
          console.log("Creating task with data:", result.data);
          return this.createTask(result.data);
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
            return this.deleteTask(result.data);
          } else if (result.data.description) {
            return this.deleteTask(result.data);
          } else {
            return {
              success: false,
              message: "I couldn't determine which task to delete. Please try being more specific."
            };
          }
          
        case 'update_task':
          if (!result.data) {
            return {
              success: false,
              message: "Missing data for update task operation"
            };
          }

          if (result.data.taskId) {
            return this.updateTask(result.data);
          } else if (result.data.description) {
            return this.updateTask(result.data);
          } else {
            return {
              success: false,
              message: "I couldn't determine which task to update. Please try being more specific."
            };
          }
          
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
