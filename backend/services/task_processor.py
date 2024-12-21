from typing import Dict, Any, Optional
from datetime import datetime
import json
from .reminder_service import ReminderService
import requests
import os
from dotenv import load_dotenv
import time
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

class TaskProcessor:
    def __init__(self):
        self.reminder_service = ReminderService()
        self.TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
        self.last_api_call = 0  # Track last API call time
        self.min_interval = 5  # Minimum seconds between API calls
        if not self.TOGETHER_API_KEY:
            raise ValueError("TOGETHER_API_KEY not found in environment variables")
        self.SYSTEM_PROMPT = """You are an AI assistant that helps manage tasks and reminders. Your role is to understand natural language requests and convert them into structured task commands. 

When a user sends a message, analyze it and respond with a JSON object that matches one of these formats:

1. For creating a task:
{
    "success": true,
    "action": "create_task",
    "data": {
        "title": "brief task title",
        "description": "detailed description or null",
        "dueDate": "ISO date string or null",
        "priority": "High|Medium|Low"
    }
}

2. For listing tasks (when user asks to see, show, list, or view their tasks):
{
    "success": true,
    "action": "list_tasks",
    "data": {}
}

3. For listing reminders (when user asks to see, show, list, or view their reminders):
{
    "success": true,
    "action": "list_reminders",
    "data": {}
}

4. For updating a task:
{
    "success": true,
    "action": "update_task",
    "data": {
        "description": "description of the task to update",
        "updates": {
            "status": "Pending|In Progress|Completed",
            "title": "new title (optional)",
            "description": "new description (optional)",
            "dueDate": "new ISO date string (optional)",
            "priority": "new priority (optional)"
        }
    }
}

5. For deleting a task:
{
    "success": true,
    "action": "delete_task",
    "data": {
        "description": "description of the task to delete"
    }
}

6. For errors:
{
    "success": false,
    "message": "helpful error message suggesting how to rephrase"
}

Examples of user requests and responses:

User: "update the aarya ai mvp task to in progress"
Response: {
    "success": true,
    "action": "update_task",
    "data": {
        "description": "aarya ai mvp",
        "updates": {
            "status": "In Progress"
        }
    }
}

User: "mark the college task as completed"
Response: {
    "success": true,
    "action": "update_task",
    "data": {
        "description": "college",
        "updates": {
            "status": "Completed"
        }
    }
}

User: "change gym task priority to high"
Response: {
    "success": true,
    "action": "update_task",
    "data": {
        "description": "gym",
        "updates": {
            "priority": "High"
        }
    }
}

Always set future dates for tasks. If a date/time is mentioned, include it in the dueDate field in ISO format.
For task listing commands, recognize variations like:
- "show my tasks"
- "list all tasks"
- "what tasks do I have"
- "show pending tasks"
- "display my to-do list"

For task update commands, recognize variations like:
- "update [task description] to [status]"
- "mark [task description] as [status]"
- "change [task description] status to [status]"
- "set [task description] priority to [priority]"
"""

    def _parse_natural_language(self, message: str) -> Dict[Any, Any]:
        """Fallback method for when API is rate limited"""
        try:
            # Simple parsing for task creation
            message = message.lower()
            title = message
            due_date = None
            priority = "Medium"
            
            # Extract date and time information
            if "tomorrow" in message:
                due_date = (datetime.now() + timedelta(days=1)).isoformat()
            elif "today" in message:
                due_date = datetime.now().isoformat()
            elif any(month in message for month in ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]):
                # Extract date from message (simplified)
                for month in ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]:
                    if month in message:
                        # Find the date number
                        words = message.split()
                        for i, word in enumerate(words):
                            if month in word and i + 1 < len(words):
                                try:
                                    day = int(''.join(filter(str.isdigit, words[i + 1])))
                                    month_num = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].index(month) + 1
                                    due_date = datetime(2024, month_num, day).isoformat()
                                    break
                                except:
                                    continue

            return {
                "success": True,
                "action": "create_task",
                "data": {
                    "title": title,
                    "description": None,
                    "dueDate": due_date,
                    "priority": priority
                }
            }
        except Exception as e:
            print("Error in fallback parsing:", str(e))
            return {
                "success": False,
                "message": "Could not parse the request"
            }

    async def process_message(self, message: str) -> Dict[Any, Any]:
        try:
            current_time = time.time()
            
            # Check if we need to wait for rate limit
            if current_time - self.last_api_call < self.min_interval:
                print("Rate limited, using fallback parser")
                return self._parse_natural_language(message)
                
            print("Received message:", message)  # Debug log
            
            # Update last API call time
            self.last_api_call = current_time
            
            # Call LLaMA model through Together API
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
                    "max_tokens": 1024,
                    "temperature": 0.7,
                }
            )
            
            print("API Response status:", response.status_code)  # Debug log
            
            if response.status_code != 200:
                print("API Error:", response.text)  # Debug log
                return {
                    "success": False,
                    "message": "Failed to process the request. Please try again."
                }

            # Parse the AI response
            ai_response = response.json()
            print("Raw AI response:", ai_response)  # Debug log
            
            if not ai_response.get('choices') or not ai_response['choices'][0].get('message'):
                return {
                    "success": False,
                    "message": "Invalid response from AI model"
                }

            content = ai_response['choices'][0]['message']['content']
            print("AI content:", content)  # Debug log

            # Clean up the content - remove markdown code blocks if present
            content = content.strip()
            if content.startswith('```') and content.endswith('```'):
                # Remove the first line (```json or just ```) and the last line (```)
                content = '\n'.join(content.split('\n')[1:-1])
            
            # Remove any remaining markdown indicators
            content = content.replace('```json', '').replace('```', '').strip()
            
            print("Cleaned content:", content)  # Debug log

            try:
                parsed_response = json.loads(content)
                print("Parsed response:", parsed_response)  # Debug log
                
                # Ensure the response has the required fields
                if not isinstance(parsed_response, dict):
                    raise ValueError("Response is not a dictionary")
                
                if "success" not in parsed_response or "action" not in parsed_response:
                    raise ValueError("Response missing required fields")
                
                if parsed_response["action"] == "create_task" and "data" not in parsed_response:
                    raise ValueError("Create task response missing data field")
                
                return parsed_response

            except json.JSONDecodeError as e:
                print("JSON parse error:", str(e))  # Debug log
                return {
                    "success": False,
                    "message": "Failed to parse AI response"
                }
            except ValueError as e:
                print("Validation error:", str(e))  # Debug log
                return {
                    "success": False,
                    "message": str(e)
                }

        except Exception as e:
            print("Error in process_message:", str(e))  # Debug log
            return {
                "success": False,
                "message": f"An error occurred: {str(e)}"
            }
