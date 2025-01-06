from typing import Dict, Any, Optional, List, Tuple
import json
import requests
import os

class IntentClassifier:
    def __init__(self):
        self.TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
        if not self.TOGETHER_API_KEY:
            raise ValueError("TOGETHER_API_KEY not found in environment variables")

        self.SYSTEM_PROMPT = """You are an AI assistant that classifies user intents. Given a message, determine the primary intent and return a JSON response in this format:

{
    "domain": "tasks|email|browser|social|system|conversation",
    "intent": "specific_intent",
    "confidence": 0.0 to 1.0
}

Domains and their intents:
1. tasks
   - create_task
   - update_task
   - delete_task
   - list_tasks
   - filter_tasks
   - batch_task_operations

2. email
   - send_email
   - read_email
   - search_email
   - filter_email
   - email_settings

3. browser
   - open_website
   - search_web
   - bookmark_page
   - browser_history
   - download_file

4. social
   - post_update
   - schedule_post
   - check_notifications
   - engage_content
   - analyze_metrics

5. system
   - check_status
   - change_settings
   - system_info
   - manage_plugins
   - help

6. conversation
   - greeting
   - farewell
   - acknowledgment
   - question
   - chitchat

Examples:
User: "create a task to buy groceries"
{
    "domain": "tasks",
    "intent": "create_task",
    "confidence": 0.95
}

User: "send an email to John"
{
    "domain": "email",
    "intent": "send_email",
    "confidence": 0.92
}

User: "open github.com"
{
    "domain": "browser",
    "intent": "open_website",
    "confidence": 0.98
}

User: "schedule a tweet for tomorrow"
{
    "domain": "social",
    "intent": "schedule_post",
    "confidence": 0.89
}

User: "what can you do?"
{
    "domain": "system",
    "intent": "help",
    "confidence": 0.85
}

User: "hello"
{
    "domain": "conversation",
    "intent": "greeting",
    "confidence": 0.99
}"""

    async def classify_intent(self, message: str) -> Dict[str, Any]:
        try:
            response = requests.post(
                "https://api.together.xyz/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.TOGETHER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                    "messages": [
                        {"role": "system", "content": self.SYSTEM_PROMPT},
                        {"role": "user", "content": message}
                    ],
                    "max_tokens": 256,
                    "temperature": 0.3,
                }
            )

            if response.status_code != 200:
                print("API Error:", response.text)
                return {
                    "domain": "conversation",
                    "intent": "error",
                    "confidence": 1.0
                }

            content = response.json()['choices'][0]['message']['content'].strip()
            if content.startswith('```') and content.endswith('```'):
                content = '\n'.join(content.split('\n')[1:-1])
            content = content.replace('```json', '').replace('```', '').strip()

            return json.loads(content)

        except Exception as e:
            print("Error in classify_intent:", str(e))
            return {
                "domain": "conversation",
                "intent": "error",
                "confidence": 1.0
            }
