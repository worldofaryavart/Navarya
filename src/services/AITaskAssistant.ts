import { AICommand } from "@/types/AICommand";
import { NewTaskInput } from "@/types/taskTypes";
import { addTask } from "@/utils/tasks";

class AITaskAssistant {
    async processCommand(command: string) {
      // 1. Parse the command using AI model
      const parsedCommand = await this.parseCommandWithAI(command);
  
      // 2. Validate task information
      const taskInfo = await this.validateTaskInfo(parsedCommand);
  
      // 3. Create or update task
      const task = await this.createOrUpdateTask(taskInfo);
  
      // 4. Handle follow-ups if needed
      if (task.needsMoreInfo) {
        return this.generateFollowUpQuestions(task);
      }
  
      // 5. Optional: Trigger additional actions
      await this.handleAdditionalActions(task);
  
      return task;
    }
  
    private async parseCommandWithAI(command: string): Promise<AICommand> {
      // Use Llama model to parse command into structured format
      const aiResponse = await this.callLlamaAPI(command);
      return this.parseAIResponseToCommand(aiResponse);
    }
  
    private async validateTaskInfo(command: AICommand) {
      // Check if all required information is present
      const missingFields = this.checkMissingFields(command);
      
      if (missingFields.length > 0) {
        return {
          ...command,
          needsMoreInfo: true,
          missingFields
        };
      }
  
      return command;
    }
  
    private async createOrUpdateTask(taskInfo: AICommand) {
      // Convert AI command to task input
      const taskInput: NewTaskInput = {
        title: taskInfo.context.title,
        description: taskInfo.context.description,
        dueDate: taskInfo.context.deadline?.toISOString(),
        priority: taskInfo.context.priority || 'Medium',
        status: 'Pending'
      };
  
      return await addTask(taskInput);
    }
  }