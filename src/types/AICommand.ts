import { TaskPriority } from "./taskTypes";

export interface AICommand {
    action: 'createTask' | 'updateTask' | 'sendEmail' | 'getInfo';
    context: {
      title?: string;
      description?: string;
      deadline?: Date;
      assignedTo?: string;
      priority?: TaskPriority;
    };
    followUpQuestions?: string[];
  }

