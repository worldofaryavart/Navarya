import { getApiUrl } from '../config/api.config';
import { TaskCommandHandler } from './taskcommands/taskHandler';
import UICommandHandler from './uiCommandHandler';
import { useRouter } from 'next/navigation';
type AppRouterInstance = ReturnType<typeof useRouter>;

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

interface ContextData {
  sessionContext?: any;
  persistentContext?: any;
}

export class AICommandHandler {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  public static async processCommand(input: string, router: AppRouterInstance, context?: ContextData): Promise<CommandResult> {
    const aiCommandHandler = new AICommandHandler(router);
    return aiCommandHandler.processCommandInternal(input, context);
  }

  private async processCommandInternal(input: string, context?: ContextData): Promise<CommandResult> {
    const lowercaseInput = input.toLowerCase();

    // Direct commands that don't need AI processing
    if (lowercaseInput === 'help' || lowercaseInput === 'show commands') {
      return TaskCommandHandler.getHelpMessage();
    }

    if (lowercaseInput === 'show tasks' || lowercaseInput === 'list tasks') {
      return TaskCommandHandler.listTasks();
    }

    try {
      // Send command with context to AI processor
      const aiResponse = await fetch(getApiUrl('/api/process-command'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: input,
          context: {
            session: context?.sessionContext || {},
            persistent: context?.persistentContext || {},
            currentTime: new Date().toISOString()
          }
        })
      });

      const result = await aiResponse.json();

      if (!aiResponse.ok) {
        console.error("API Error:", result);
        return {
          success: false,
          message: result.detail || "Failed to process the command. Please try again."
        };
      }

      const uiCommandHandler = new UICommandHandler(this.router);
      const uiCommands = UICommandHandler.parseAIResponse(result);
      console.log("UI commands are:", uiCommands);
      
      for (const command of uiCommands) {
        console.log("Executing UI command:", command);
        await uiCommandHandler.executeCommand(command);
      }

      if (!result.success) {
        return {
          success: false,
          message: result.message || "I couldn't understand that command. Try rephrasing or type 'help' to see available commands."
        };
      }

      // Handle different actions based on AI response
      switch (result.action) {
        case 'batch_operations':
          if (result.data?.operations) {
            return TaskCommandHandler.processBatchOperations(result.data.operations);
          }
          break;

        case 'conversation':
          if (result.data?.response) {
            return {
              success: true,
              message: result.data.response
            };
          }
          break;

        case 'create_task':
          return TaskCommandHandler.createTask(result.data);

        case 'list_tasks':
          return TaskCommandHandler.listTasks(result.data?.filter);

        case 'delete_task':
          if (!result.data?.taskId && !result.data?.description) {
            return {
              success: false,
              message: "I couldn't determine which task to delete. Please try being more specific."
            };
          }
          return TaskCommandHandler.deleteTask(result.data);

        case 'update_task':
          if (!result.data?.taskId && !result.data?.description) {
            return {
              success: false,
              message: "I couldn't determine which task to update. Please try being more specific."
            };
          }
          return TaskCommandHandler.updateTask(result.data);

        default:
          console.log("Unknown action:", result.action);
          return {
            success: false,
            message: "I couldn't understand that command. Try rephrasing or type 'help' to see available commands."
          };
      }

      return result;
    } catch (error) {
      console.error('Command processing error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error processing your command. Please try again.'
      };
    }
  }
}
