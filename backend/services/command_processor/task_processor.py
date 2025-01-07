from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json
import re
from .base_processor import BaseCommandProcessor

class TaskProcessor(BaseCommandProcessor):
    def __init__(self, db):
        super().__init__(db)
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

2. For listing tasks:
{
    "success": true,
    "action": "list_tasks",
    "data": {
        "filter": {
            "status": "Pending|In Progress|Completed",
            "priority": "High|Medium|Low",
            "due": "today|overdue|upcoming",
            "created": "today"
        }
    }
}

3. For updating a task:
{
    "success": true,
    "action": "update_task",
    "data": {
        "description": "description of task to update",
        "updates": {
            "status": "Pending|In Progress|Completed",
            "title": "new title (optional)",
            "description": "new description (optional)",
            "dueDate": "new ISO date string (optional)",
            "priority": "new priority (optional)"
        }
    }
}

4. For deleting a task:
{
    "success": true,
    "action": "delete_task",
    "data": {
        "description": "description of task to delete"
    }
}

5. For batch operations:
{
    "success": true,
    "action": "batch_operations",
    "data": {
        "operations": [
            {
                "type": "create_task|update_task|delete_task",
                "data": { ... }
            }
        ]
    }
}"""

    def get_system_prompt(self) -> str:
        return self.SYSTEM_PROMPT

    def _parse_natural_language(self, message: str, context: Dict = None) -> Dict[Any, Any]:
        """Parse natural language into structured task data"""
        message = message.lower()
        
        # Check for context-based references
        if context and 'lastSuccessfulCommand' in context:
            last_command = context['lastSuccessfulCommand']
            if any(word in message for word in ['it', 'that', 'this']):
                message = f"{message} (referring to: {last_command['command']})"

        # Handle update commands
        if any(word in message for word in ['change', 'modify', 'update']):
            return {
                'success': True,
                'action': 'update_task',
                'data': {
                    'description': message,
                    'updates': self._extract_task_updates(message)
                }
            }

        # Handle list commands
        if any(word in message for word in ['show', 'list', 'display']):
            return {
                'success': True,
                'action': 'list_tasks',
                'data': {
                    'filter': self._extract_list_filters(message)
                }
            }

        # Handle delete commands
        if any(word in message for word in ['delete', 'remove']):
            return {
                'success': True,
                'action': 'delete_task',
                'data': {
                    'description': message
                }
            }

        # Default to create task
        return {
            'success': True,
            'action': 'create_task',
            'data': self._extract_task_data(message)
        }

    def _extract_task_updates(self, message: str) -> Dict[str, Any]:
        """Extract task update information from message"""
        updates = {}
        
        # Extract date changes
        if 'today' in message:
            updates['dueDate'] = datetime.now().strftime('%Y-%m-%d')
        elif 'tomorrow' in message:
            updates['dueDate'] = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
        # Extract priority changes
        if 'high' in message:
            updates['priority'] = 'High'
        elif 'medium' in message:
            updates['priority'] = 'Medium'
        elif 'low' in message:
            updates['priority'] = 'Low'
            
        # Extract status changes
        if 'complete' in message:
            updates['status'] = 'Completed'
        elif 'start' in message:
            updates['status'] = 'In Progress'
            
        return updates

    def _extract_list_filters(self, message: str) -> Dict[str, Any]:
        """Extract list filter criteria from message"""
        filters = {}
        
        # Status filters
        if 'pending' in message:
            filters['status'] = 'Pending'
        elif 'progress' in message:
            filters['status'] = 'In Progress'
        elif 'complete' in message:
            filters['status'] = 'Completed'
            
        # Priority filters
        if 'high' in message:
            filters['priority'] = 'High'
        elif 'medium' in message:
            filters['priority'] = 'Medium'
        elif 'low' in message:
            filters['priority'] = 'Low'
            
        # Time filters
        if 'today' in message:
            filters['due'] = 'today'
        elif 'overdue' in message:
            filters['due'] = 'overdue'
        elif 'upcoming' in message:
            filters['due'] = 'upcoming'
            
        return filters

    def _extract_task_data(self, message: str) -> Dict[str, Any]:
        """Extract task creation data from message"""
        data = {
            'title': message,
            'description': None,
            'dueDate': None,
            'priority': 'Medium'  # default priority
        }
        
        # Extract due date
        if 'today' in message:
            data['dueDate'] = datetime.now().strftime('%Y-%m-%d')
        elif 'tomorrow' in message:
            data['dueDate'] = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
        # Extract priority
        if 'high' in message:
            data['priority'] = 'High'
        elif 'low' in message:
            data['priority'] = 'Low'
            
        return data

    def process_ai_response(self, content: str) -> Dict[Any, Any]:
        try:
            try:
                parsed_response = json.loads(content)
            except json.JSONDecodeError:
                json_matches = re.findall(r'\{[\s\S]*"success"[\s\S]*"action"[\s\S]*\}', content)
                if not json_matches:
                    return {
                        "success": False,
                        "message": "No valid JSON found in response"
                    }
                parsed_response = json.loads(json_matches[-1])

            print("Parsed response:", parsed_response)
            
            if parsed_response.get('action') == 'update_task' and \
               parsed_response.get('data', {}).get('updates', {}).get('dueDate'):
                updates = parsed_response['data']['updates']
                if 'tomorrow' in updates['dueDate'].lower():
                    tomorrow = datetime.now() + timedelta(days=1)
                    tomorrow = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
                    updates['dueDate'] = tomorrow.isoformat() + 'Z'
            
            if not isinstance(parsed_response, dict):
                raise ValueError("Response is not a dictionary")
            
            if "success" not in parsed_response or "action" not in parsed_response:
                raise ValueError("Response missing required fields")
            
            return parsed_response

        except json.JSONDecodeError as e:
            print("JSON parse error:", str(e))
            return {
                "success": False,
                "message": "Failed to parse AI response"
            }
        except ValueError as e:
            print("Validation error:", str(e))
            return {
                "success": False,
                "message": str(e)
            }
