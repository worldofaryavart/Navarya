import { Task, NewTaskInput, TaskStatus, TaskPriority } from '@/types/taskTypes';
import { addTask, deleteTask, getTasks, updateTask } from '@/utils/tasks/tasks';

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export class TaskCommandHandler {
  public static async createTask(data: any): Promise<CommandResult> {
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

  public static async findTaskByDescription(searchTerms: string[]): Promise<Task | null> {
    try {
      const tasks = await getTasks();
      if (!tasks || tasks.length === 0) return null;

      const lowerSearchTerms = searchTerms.map(term => term.toLowerCase());
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

      return maxMatchCount > 0 ? bestMatch : null;
    } catch (error) {
      console.error('Find task error:', error);
      return null;
    }
  }

  public static async deleteTask(data: any): Promise<CommandResult> {
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

  public static async updateTask(data: any): Promise<CommandResult> {
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

  public static async listTasks(filter?: {
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

  public static async processBatchOperations(operations: any[]): Promise<CommandResult> {
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

  public static getHelpMessage(): CommandResult {
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
}