import { getApiUrl } from '@/utils/config/api.config';
import UICommandHandler from '@/utils/ai/uiCommandHandler';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/config/firebase.config';
import { Task } from '@/types/taskTypes';
import { getTasks } from '@/services/task_services/tasks';

type AppRouterInstance = ReturnType<typeof useRouter>;

interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return token;
};

export class AICommandHandler {
    private router: AppRouterInstance;
    private setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
    private fetchTasks?: () => Promise<void>;

    constructor(
        router: AppRouterInstance, 
        setTasks?: React.Dispatch<React.SetStateAction<Task[]>>,
        fetchTasks?: () => Promise<void>
    ) {
        this.router = router;
        this.setTasks = setTasks;
        this.fetchTasks = fetchTasks;
    }

    public static async processCommand(
        userMessage: Message, 
        router: AppRouterInstance,
        setTasks?: React.Dispatch<React.SetStateAction<Task[]>>,
        fetchTasks?: () => Promise<void>
    ): Promise<CommandResult> {
        const aiCommandHandler = new AICommandHandler(router, setTasks, fetchTasks);
        return aiCommandHandler.processCommandInternal(userMessage);
    }

    private async processCommandInternal(userMessage: Message): Promise<CommandResult> {
        try {
            // Send command with context to AI processor
            console.log("Sending user command: ", userMessage);
            const token = await getAuthToken();
            const aiResponse = await fetch(getApiUrl('/api/process-command'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userMessage)
            });

            const result = await aiResponse.json();
            console.log("result of ai response is : ", result);

            // Handle task-related commands
            if (result.domain === 'task') {
                console.log("Task command detected");
                
                // First, redirect to the tasks page if we're not already there
                this.router.push('/tasks');
                
                // Then fetch the latest tasks and update the context
                if (this.fetchTasks) {
                    await this.fetchTasks();
                } else {
                    // Fallback if fetchTasks isn't provided
                    try {
                        const fetchedTasks = await getTasks();
                        if (this.setTasks) {
                            this.setTasks(fetchedTasks);
                        }
                    } catch (error) {
                        console.error("Failed to fetch tasks after command:", error);
                    }
                }
            }

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