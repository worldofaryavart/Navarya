export type AICommandType = 
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'LIST_TASKS'
  | 'SET_REMINDER'
  | 'UNKNOWN';

export interface AICommandResult {
  type: AICommandType;
  data?: any;
  message: string;
  success: boolean;
}

export const parseAICommand = async (input: string): Promise<AICommandResult> => {
  const lowercaseInput = input.toLowerCase();

  // Task Creation
  if (lowercaseInput.includes('create task') || lowercaseInput.includes('add task')) {
    const taskTitle = input.replace(/create task|add task/i, '').trim();
    return {
      type: 'CREATE_TASK',
      data: {
        title: taskTitle,
        status: 'Pending',
        priority: 'Medium',
        createdAt: new Date()
      },
      message: `Creating new task: ${taskTitle}`,
      success: true
    };
  }

  // Add more command parsing here...
  
  return {
    type: 'UNKNOWN',
    message: 'Command not recognized',
    success: false
  };
};