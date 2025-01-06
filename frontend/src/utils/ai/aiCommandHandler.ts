import { getApiUrl } from '../config/api.config';
import { TaskCommandHandler } from './taskcommands/taskHandler';
import { ReminderCommandHandler } from './reminderCommands/reminderCommandHandler';

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
  public static async processCommand(input: string): Promise<CommandResult> {
    const lowercaseInput = input.toLowerCase();

    // Direct commands that don't need AI processing
    if (lowercaseInput === 'help' || lowercaseInput === 'show commands') {
      return TaskCommandHandler.getHelpMessage();
    }

    if (lowercaseInput === 'show tasks' || lowercaseInput === 'list tasks') {
      console.log("tasks is listed");
      return TaskCommandHandler.listTasks();
    }

    if (lowercaseInput === 'show reminders' || lowercaseInput === 'list reminders') {
      console.log("reminder is listed");
      return ReminderCommandHandler.listReminders();
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
        return TaskCommandHandler.processBatchOperations(result.data.operations);
      }

      if (result.action === 'conversation' && result.data?.response) {
        return {
          success: true,
          message: result.data.response
        };
      }

      if (result.action === 'list_tasks' && result.data?.filter) {
        return TaskCommandHandler.listTasks(result.data.filter);
      }

      if (result.action === 'list_reminders' && result.data?.filter) {
        return ReminderCommandHandler.listReminders(result.data.filter);
      }

      // Handle different actions based on AI response
      switch (result.action) {
        case 'create_task': {
          console.log("Creating task with data:", result.data);
          return TaskCommandHandler.createTask(result.data);
        }
          
        case 'list_tasks':
          return TaskCommandHandler.listTasks();

        case 'list_reminders':
          return ReminderCommandHandler.listReminders();
          
        case 'delete_task':
          if (!result.data) {
            return {
              success: false,
              message: "Missing data for delete task operation"
            };
          }
          
          if (result.data.taskId || result.data.description) {
            return TaskCommandHandler.deleteTask(result.data);
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

          if (result.data.taskId || result.data.description) {
            return TaskCommandHandler.updateTask(result.data);
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
