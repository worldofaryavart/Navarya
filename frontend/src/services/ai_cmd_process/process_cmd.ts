import { getApiUrl } from '@/utils/config/api.config';
import UICommandHandler from '@/utils/ai/uiCommandHandler';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/config/firebase.config';
type AppRouterInstance = ReturnType<typeof useRouter>;

interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
}

interface Message {
    role: 'user' | 'ai';
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

    constructor(router: AppRouterInstance) {
        this.router = router;
    }
    public static async processCommand(userMessage: Message, router: AppRouterInstance): Promise<CommandResult> {
        const aiCommandHandler = new AICommandHandler(router);
        return aiCommandHandler.processCommandInternal(userMessage);
    }

    private async processCommandInternal(userMessage: Message): Promise<CommandResult> {
        // const lowercaseInput = input.toLowerCase();

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
