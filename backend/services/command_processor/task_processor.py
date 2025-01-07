from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
import re
from .base_processor import BaseCommandProcessor

class TaskProcessor(BaseCommandProcessor):
    def __init__(self, db):
        super().__init__(db)
        self.tasks_collection = db.collection('tasks')
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

    async def _get_task_by_description(self, description: str, user_id: str) -> Optional[Dict]:
        """Get task by partial description match"""
        try:
            tasks_ref = self.tasks_collection.where('user_id', '==', user_id)
            tasks = tasks_ref.get()
            
            # Convert description to lowercase for case-insensitive matching
            description_lower = description.lower()
            
            matching_tasks = []
            for task in tasks:
                task_data = task.to_dict()
                if description_lower in task_data.get('title', '').lower():
                    task_data['id'] = task.id
                    matching_tasks.append(task_data)
            
            # Return the most recently created matching task
            if matching_tasks:
                return sorted(matching_tasks, key=lambda x: x.get('created_at', ''), reverse=True)[0]
            return None
        except Exception as e:
            print(f"Error getting task by description: {str(e)}")
            return None

    async def _update_task(self, task_id: str, updates: Dict[str, Any]) -> bool:
        """Update a task with given updates"""
        try:
            task_ref = self.tasks_collection.document(task_id)
            task_ref.update({
                **updates,
                'updated_at': datetime.utcnow()
            })
            return True
        except Exception as e:
            print(f"Error updating task: {str(e)}")
            return False

    async def process_message(self, message: str, session_context: Dict = None, persistent_context: Dict = None, current_time: str = None) -> Dict[Any, Any]:
        try:
            # Get user ID from context
            user_id = session_context.get('user_id', 'anonymous') if session_context else 'anonymous'
            
            # Check for follow-up references
            if session_context and 'lastSuccessfulCommand' in session_context:
                last_command = session_context['lastSuccessfulCommand']
                if self._is_followup_reference(message):
                    # Get the referenced task
                    referenced_task = await self._get_task_by_description(
                        last_command.get('taskTitle', ''),
                        user_id
                    )
                    if referenced_task:
                        message = self._resolve_followup_reference(message, referenced_task)

            # Process the message using the base processor
            result = await super().process_message(message, session_context, persistent_context, current_time)

            # If this is an update operation, store the task title for future reference
            if result.get('success') and result.get('action') in ['create_task', 'update_task']:
                result['taskTitle'] = result.get('data', {}).get('title') or message

            return result
        except Exception as e:
            print(f"Error in task processor: {str(e)}")
            return {
                'success': False,
                'message': f"Error processing task command: {str(e)}"
            }

    def _is_followup_reference(self, message: str) -> bool:
        """Check if message contains follow-up references"""
        references = ['it', 'that', 'this', 'the task', 'this task', 'that task']
        message_lower = message.lower()
        return any(ref in message_lower for ref in references)

    def _resolve_followup_reference(self, message: str, referenced_task: Dict) -> str:
        """Resolve follow-up reference using the referenced task"""
        message_lower = message.lower()
        
        # Handle different types of updates
        if 'delete' in message_lower or 'remove' in message_lower:
            return f"delete task {referenced_task['title']}"
        elif 'complete' in message_lower or 'finish' in message_lower:
            return f"mark task {referenced_task['title']} as completed"
        elif 'change' in message_lower or 'update' in message_lower or 'set' in message_lower:
            # Extract the update part (after 'to' or 'as')
            update_parts = re.split(r'\s+(?:to|as)\s+', message_lower)
            if len(update_parts) > 1:
                return f"update task {referenced_task['title']} {update_parts[1]}"
            
        return f"update task {referenced_task['title']} {message}"

    def _extract_task_updates(self, message: str) -> Dict[str, Any]:
        """Extract task update information from message"""
        updates = {}
        message_lower = message.lower()
        
        # Extract date changes
        if 'today' in message_lower:
            updates['due_date'] = datetime.now().strftime('%Y-%m-%d')
        elif 'tomorrow' in message_lower:
            updates['due_date'] = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Extract recurring pattern
        if 'repeat' in message_lower or 'recurring' in message_lower:
            if 'monday' in message_lower:
                updates['recurring'] = {'frequency': 'weekly', 'day': 'monday'}
            elif 'daily' in message_lower:
                updates['recurring'] = {'frequency': 'daily'}
            elif 'weekly' in message_lower:
                updates['recurring'] = {'frequency': 'weekly'}
            elif 'monthly' in message_lower:
                updates['recurring'] = {'frequency': 'monthly'}
        
        # Extract priority changes
        if 'high' in message_lower:
            updates['priority'] = 'high'
        elif 'medium' in message_lower:
            updates['priority'] = 'medium'
        elif 'low' in message_lower:
            updates['priority'] = 'low'
        
        # Extract status changes
        if 'complete' in message_lower or 'done' in message_lower:
            updates['status'] = 'completed'
        elif 'start' in message_lower or 'in progress' in message_lower:
            updates['status'] = 'in_progress'
        
        return updates

    async def _create_recurring_instances(self, task: Dict) -> None:
        """Create recurring instances of a task"""
        if not task.get('recurring'):
            return
            
        recurring = task['recurring']
        frequency = recurring['frequency']
        
        # Calculate next occurrence
        base_date = datetime.strptime(task['due_date'], '%Y-%m-%d')
        if frequency == 'daily':
            next_date = base_date + timedelta(days=1)
        elif frequency == 'weekly':
            next_date = base_date + timedelta(weeks=1)
        elif frequency == 'monthly':
            # Add one month (approximately)
            next_date = base_date + timedelta(days=30)
            
        # Create next instance
        next_instance = {
            **task,
            'due_date': next_date.strftime('%Y-%m-%d'),
            'parent_task_id': task.get('id'),
            'created_at': datetime.utcnow()
        }
        
        # Remove id to create new document
        next_instance.pop('id', None)
        
        try:
            self.tasks_collection.add(next_instance)
        except Exception as e:
            print(f"Error creating recurring instance: {str(e)}")

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
