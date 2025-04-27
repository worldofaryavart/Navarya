from typing import Dict, Any, Optional, List, TypedDict, Union
from datetime import datetime
from dateutil import parser
import pytz
from enum import Enum
from dataclasses import dataclass
from services.command_processor.base_processor import BaseCommandProcessor
from services.task_services import TaskService
import json
from services.reminder_service import ReminderService
import requests
import os


class TaskPriority(Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class TaskStatus(Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class RecurrenceType(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

@dataclass
class TaskData:
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    reminder: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert TaskData to dictionary with standardized field names"""
        return {
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date,  
            'priority': self.priority.value,
            'status': self.status.value,
            'reminder': self.reminder  
        }

class TaskValidationError(Exception):
    """Custom exception for task validation errors"""
    pass

class TaskProcessor(BaseCommandProcessor):
    FIELD_MAPPING = {
        # Title variations
        'task_name': 'title',
        'name': 'title',
        'task': 'title',
        
        # Due date variations
        'due': 'due_date',
        'deadline': 'due_date',
        'due_time': 'due_date',
        
        # Reminder variations
        'reminder_date': 'reminder',
        'reminder_time': 'reminder',
        'remind_at': 'reminder',
        'alert': 'reminder',
        
        # Priority variations
        'task_priority': 'priority',
        'importance': 'priority',
        
        # Status variations
        'task_status': 'status',
        'state': 'status'
    }
    
    def __init__(self, db):
        super().__init__(db)
        self.task_service = TaskService(db)
        self.reminder_service = ReminderService(db)
        self.timezone = pytz.timezone('Asia/Kolkata')
        self.DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
        if not self.DEEPSEEK_API_KEY:
            raise ValueError("DEEPSEEK_API_KEY not found in environment variables")

    def get_system_prompt_subdomain(self, message: str, conversation_context: dict = None) -> str:
        """
        Builds the system prompt for the task subdomain detector.
        The AI must identify one of: create_tasks, list_tasks, update_tasks, delete_tasks.
        """
        current_date = datetime.now().strftime("%Y-%m-%d")
        context_json = (
            json.dumps(conversation_context, indent=2, default=self.firestore_object_handler)
            if conversation_context else "{}"
        )

        prompt = f"""
    You are a Task Subdomain Detector. Your job is to analyze the user's request and determine which task subdomain it belongs to:
    - create_tasks
    - list_tasks
    - update_tasks
    - delete_tasks

    Return your result as a JSON object with the following schema:
    {{
        "success": <true|false>,          # Whether detection was successful
        "subdomain": <string|null>,      # One of the four subdomains or null if unknown
        "confidence": <float>,           # Confidence score between 0.0 and 1.0
        "message": <string>              # Human-readable explanation
    }}

    Current Date: {current_date}

    Conversation Context:
    {context_json}

    User Message:
    """ + message + """

    # Guidelines:
    # - Use the context above to interpret references and maintain continuity.
    # - If the intent is unclear, respond with success=false and subdomain=null.
    # - Do not include any extra keys in the output.
    """
        return prompt

    async def process_message(self, intent: Dict[str, Any], message: str, conversation_context: Optional[Dict[str, Any]] = None, user_token: str = "") -> Dict[str, Any]:
        """Process user message with enhanced error handling"""
        try:
            parsed_result = await self._parse_natural_language(message)
            print('\n\n')
            if not parsed_result['success']:
                return parsed_result
                
            ai_result = await super().process_message(intent, message, conversation_context)

            processed_result = await self.process_ai_result(ai_result, user_token)
                
            # processed_result = await self.process_ai_response(ai_result, user_token)
            print("processed_result: ", processed_result)
            print('\n\n')
            return processed_result
            
        except TaskValidationError as e:
            return self._error_response(str(e), "validation_error")
        except Exception as e:
            return self._error_response(f"Unexpected error: {str(e)}", "system_error")

    def _error_response(self, message: str, error_type: str) -> Dict[str, Any]:
        """Create standardized error response"""
        return {
            'success': False,
            'message': message,
            'error_type': error_type,
            'timestamp': datetime.now(self.timezone).isoformat()
        }

    def _success_response(self, action: str, data: Any, message: str) -> Dict[str, Any]:
        """Create standardized success response"""
        return {
            'success': True,
            'action': action,
            'data': data,
            'message': message,
            'timestamp': datetime.now(self.timezone).isoformat()
        }

    async def _handle_task_action(self, result: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """Route task actions to appropriate handlers"""
        action_handlers = {
            'create_task': self._create_task,
            'list_tasks': self._list_tasks,
            'update_task': self._update_task,
            'delete_task': self._delete_task,
            'batch_operations': self._handle_batch_operations
        }
        
        action = result['action']
        handler = action_handlers.get(action)
        print("handler is : ", handler)
        
        if not handler:
            return self._error_response(f"Unknown action: {action}", "invalid_action")
            
        try:
            return await handler(result.get('data', {}), user_token)
        except Exception as e:
            return self._error_response(f"Error in {action}: {str(e)}", "action_error")

    def _normalize_field_names(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize field names to match our standard schema"""
        normalized = {}
        for key, value in data.items():
            # Convert key to lowercase for case-insensitive matching
            lower_key = key.lower()
            # Use mapped field name if exists, otherwise use original
            normalized_key = self.FIELD_MAPPING.get(lower_key, key)
            normalized[normalized_key] = value
        return normalized
    
    def _parse_datetime(self, value: Any) -> Optional[datetime]:
        """Parse datetime from various formats"""
        if not value:
            return None
            
        if isinstance(value, datetime):
            # Ensure datetime has timezone info
            if value.tzinfo is None:
                return self.timezone.localize(value)
            return value
            
        if isinstance(value, str):
            try:
                # Try parsing our standard format first ("21 January 2025 at 11:44:27 UTC+5:30")
                if "at" in value and "UTC" in value:
                    # Remove UTC offset and parse
                    clean_date = value.split(" UTC")[0]
                    dt = datetime.strptime(clean_date, "%d %B %Y at %H:%M:%S")
                    return self.timezone.localize(dt)
                    
                # Try parsing ISO format
                dt = datetime.fromisoformat(value)
                if dt.tzinfo is None:
                    return self.timezone.localize(dt)
                return dt
            except ValueError:
                try:
                    # Try parsing with dateutil parser as fallback
                    dt = parser.parse(value)
                    if dt.tzinfo is None:
                        return self.timezone.localize(dt)
                    return dt
                except:
                    return None
        return None
    
    def _validate_task_data(self, data: Dict[str, Any]) -> TaskData:
        """Validate and convert task data with normalized field names"""
        # Normalize field names first
        normalized_data = self._normalize_field_names(data)
        
        if not normalized_data.get('title'):
            raise TaskValidationError("Task title is required")
            
        try:
            # Parse dates
            due_date = self._parse_datetime(normalized_data.get('due_date'))
            reminder = self._parse_datetime(normalized_data.get('reminder'))
            
            task_data = TaskData(
                title=normalized_data['title'],
                description=normalized_data.get('description'),
                priority=TaskPriority(normalized_data.get('priority', 'Medium')),
                status=TaskStatus(normalized_data.get('status', 'Pending')),
                due_date=due_date,
                reminder=reminder
            )
            return task_data
        except ValueError as e:
            raise TaskValidationError(f"Invalid task data: {str(e)}")

    async def _create_task(self, data: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """Create task with validated data"""
        print("data in create task is  ", data)
        task_data = self._validate_task_data(data)
        task_dict = task_data.to_dict()
        
        task_result = await self.task_service.add_task(task_dict, user_token)
        
        if task_data.reminder:
            try:
                reminder = await self._add_reminder(task_result['id'], task_result['userId'], task_data.reminder)
                task_result['reminder'] = reminder
            except Exception as e:
                task_result['reminder_error'] = str(e)
        
        return self._success_response('create_task', task_result, "Task created successfully")

    async def _add_reminder(self, task_id: str, user_id: str, reminder_time: datetime) -> Dict[str, Any]:
        """Add reminder with validation"""
        reminder_time = self.timezone.localize(reminder_time)
        
        return self.reminder_service.add_task_reminder(
            task_id=task_id,
            user_id=user_id,
            reminder_time=reminder_time,
            recurring=None
        )

    async def _list_tasks(self, data: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """List tasks with enhanced filtering"""
        tasks = await self.task_service.get_tasks(user_token)
        
        if data.get('filter'):
            tasks = self._apply_filters(tasks, data['filter'])
            
        # if data.get('include_reminders'):
        #     tasks = await self._include_reminders(tasks)
            
        return self._success_response('list_tasks', tasks, f"Found {len(tasks)} tasks")

    def _apply_filters(self, tasks: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply filters with validation"""
        filtered_tasks = tasks
        print("filters are : ", filters)
        
        if filters.get('status'):
            try:
                status = TaskStatus(filters['status']).value
                filtered_tasks = [t for t in filtered_tasks if t.get('status') == status]
            except ValueError:
                pass
                
        if filters.get('priority'):
            try:
                priority = TaskPriority(filters['priority']).value
                filtered_tasks = [t for t in filtered_tasks if t.get('priority') == priority]
            except ValueError:
                pass
                
        if filters.get('has_reminder') is not None:
            filtered_tasks = [t for t in filtered_tasks if bool(t.get('reminder')) == filters['has_reminder']]
            
        if filters.get('due_date'):
            try:
                # Parse the filter date using our datetime parser
                filter_date = self._parse_datetime(filters['due_date'])
                if filter_date:
                    filter_date = filter_date.date()
                    filtered_tasks = [t for t in filtered_tasks if t.get('due_date') and 
                                    self._parse_datetime(t['due_date']).date() == filter_date]
            except (ValueError, AttributeError):
                pass
                
        return filtered_tasks

    async def _include_reminders(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Include reminder details in tasks"""
        for task in tasks:
            if task.get('reminder'):
                task['reminders'] = self.reminder_service.get_task_reminders(task['id'])
        return tasks

    async def _update_task(self, data: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """Update task with validation"""
        if not data.get('description'):
            return self._error_response("Task description is required for update", "validation_error")
            
        tasks = await self.task_service.get_tasks(user_token)
        task_to_update = next(
            (t for t in tasks if t['title'].lower() in data['description'].lower()),
            None
        )
        
        if not task_to_update:
            return self._error_response("Task not found", "not_found")
            
        updates = data.get('updates', {})
        
        try:
            if updates.get('priority'):
                updates['priority'] = TaskPriority(updates['priority']).value
            if updates.get('status'):
                updates['status'] = TaskStatus(updates['status']).value
                
            if 'reminder' in updates:
                if updates['reminder'] is None:
                    self.reminder_service.remove_task_reminder(task_to_update['id'])
                else:
                    reminder = await self._add_reminder(
                        task_to_update['id'],
                        task_to_update['userId'],
                        updates['reminder']
                    )
                    updates['reminder'] = reminder
                    
            task_result = await self.task_service.update_task(
                task_to_update['id'],
                {**task_to_update, **updates},
                user_token
            )
            
            return self._success_response('update_task', task_result, "Task updated successfully")
            
        except Exception as e:
            return self._error_response(f"Error updating task: {str(e)}", "update_error")

    async def _delete_task(self, data: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """Delete task with cleanup"""
        if not data.get('description'):
            return self._error_response("Task description is required for deletion", "validation_error")
            
        tasks = await self.task_service.get_tasks(user_token)
        task_to_delete = next(
            (t for t in tasks if t['title'].lower() in data['description'].lower()),
            None
        )
        
        if not task_to_delete:
            return self._error_response("Task not found", "not_found")
            
        try:
            # Remove reminders first
            self.reminder_service.remove_task_reminder(task_to_delete['id'])
            
            # Then delete task
            await self.task_service.delete_task(task_to_delete['id'], user_token)
            
            return self._success_response(
                'delete_task',
                {'deleted': task_to_delete['id']},
                "Task and associated reminders deleted successfully"
            )
            
        except Exception as e:
            return self._error_response(f"Error deleting task: {str(e)}", "delete_error")

    async def _handle_batch_operations(self, data: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """Handle batch operations with transaction-like behavior"""
        if not data.get('operations'):
            return self._error_response("No operations specified", "validation_error")
            
        batch_results = []
        success_count = 0
        
        for op in data['operations']:
            try:
                if op['type'] == 'create_task':
                    result = await self._create_task(op['data'], user_token)
                elif op['type'] == 'update_task':
                    result = await self._update_task(op['data'], user_token)
                elif op['type'] == 'delete_task':
                    result = await self._delete_task(op['data'], user_token)
                else:
                    result = self._error_response(f"Unknown operation type: {op['type']}", "invalid_operation")
                    
                batch_results.append({
                    'type': op['type'],
                    'success': result['success'],
                    'result': result
                })
                
                if result['success']:
                    success_count += 1
                    
            except Exception as e:
                batch_results.append({
                    'type': op['type'],
                    'success': False,
                    'error': str(e)
                })
                
        return self._success_response(
            'batch_operations',
            {
                'batch_results': batch_results,
                'total_operations': len(data['operations']),
                'successful_operations': success_count
            },
            f"Completed {success_count}/{len(data['operations'])} operations successfully"
        )

    async def _parse_natural_language(self, message: str) -> Dict[str, Any]:
        """Parse natural language command to identify task-related intents"""
        try:
            # Default response structure
            response = {
                'success': True,
                'message': '',
                'data': {}
            }
            
            # Basic validation
            if not message or not isinstance(message, str):
                return {
                    'success': False,
                    'message': 'Invalid message format',
                    'data': {}
                }

            # Add your natural language processing logic here
            # For now, return a simple success response
            response['message'] = 'Message processed successfully'
            return response
            
        except Exception as e:
            print(f"Error detecting intent: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to parse message: {str(e)}',
                'data': {}
            }

    async def process_ai_result(self, ai_result: Dict[str, Any], user_token: str = "") -> Dict[str, Any]:
        """Process AI result and extract task-related information"""
        try:
            print("ready to process in task processor 2.. \n\n")
            print("ai_result in task processor 2 is ", ai_result)
            
            # Convert ai_result to JSON if it's not already
            if isinstance(ai_result, str):
                ai_result = json.loads(ai_result)
            
            # Check if success is True
            if not ai_result.get('success'):
                return {
                    'success': False,
                    'message': 'AI result is not successful'
                }
            
            # Message in subdomain
            message = ai_result.get('message')
            # Get the appropriate system prompt based on subdomain
            subdomain = ai_result.get('subdomain')
            if subdomain == 'list_tasks':
                system_prompt = self.get_list_tasks_system_prompt(message)
            elif subdomain == 'create_tasks':
                system_prompt = self.get_create_tasks_system_prompt()
            elif subdomain == 'update_tasks':
                system_prompt = self.get_update_tasks_system_prompt()
            elif subdomain == 'delete_tasks':
                system_prompt = self.get_delete_tasks_system_prompt()
            else:
                return {
                    'success': False,
                    'message': f'Unknown subdomain: {subdomain}'
                }
                        
            # Call AI API with the system prompt
            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": system_prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 300,  # Increased token limit for more complete responses
                "response_format": {"type": "json_object"}
            }
            
            headers = {
                "Authorization": f"Bearer {self.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            }

            response = requests.post("https://api.deepseek.com/v1/chat/completions", json=payload, headers=headers)

            if response.status_code != 200:
                return {"success": False, "message": f"API error: {response.text}"}

            ai_payload = response.json()
            choice = ai_payload.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            
            if not choice:
                return {"success": False, "message": "Empty response from AI"}
            
            # Parse the JSON response
            try:
                print("choice is : " , choice)
                ai_response = json.loads(choice)
                
                # Ensure the response has the expected structure
                if not ai_response.get('response') or not ai_response['response'].get('action'):
                    return {"success": False, "message": "AI response missing required structure"}
                
                # Process the AI response
                process_response = await self.process_ai_response(ai_response, user_token)
                return process_response
                
            except json.JSONDecodeError:
                return {"success": False, "message": "Failed to parse AI response as JSON"}
                
        except Exception as e:
            return {"success": False, "message": f"Error processing AI result: {str(e)}"}
        
    def get_list_tasks_system_prompt(self, message: str) -> str:
        """
        Get system prompt for listing tasks with user message context
        """
        system_prompt = f"""
        You are a task management assistant. The user is asking to list or view their tasks.
        Help retrieve and display their tasks in an organized manner.
        Consider the following:
        1. Determine if they want to view all tasks or filter by criteria (date, priority, completion status) based on their message
        2. If they mention specific filters, apply those to the task list
        3. Format the tasks in a clear, readable way
        4. If they're asking for a count or summary, provide that information
        5. If they ask about specific tasks or categories, focus on those
        6. If they ask for a specific date, check if it's in the future or past and respond accordingly
        
        User's message: "{message}"
        
        In your response, include:
        - A brief acknowledgment of their request
        - The task list or summary they requested
        - A helpful action they might want to take next

        Please format your response as a JSON object with the following structure:
        {{
            "response": {{
                "action": "list_tasks",
                "data": {{
                    "filter": {{
                        "priority": "High", // Optional - one of: "High", "Medium", "Low"
                        "status": "Completed", // Optional - one of: "Pending", "In Progress", "Completed"
                        "due_date": "2023-10-01", // Optional - date format YYYY-MM-DD
                        "has_reminder": true // Optional - boolean
                    }},
                    "include_reminders": true // Optional - boolean
                }},
                "message": "Human-friendly message"
            }},
            "context_updates": {{}} // Optional context updates
        }}
        """
        return system_prompt
    
    def get_create_tasks_system_prompt(self) -> str:
        """
        Get system prompt for creating tasks
        """
        system_prompt = """
        You are a task management assistant. The user is asking to create or add a new task.
        Help them create a well-defined task entry.
        Consider the following:
        1. Extract the task title and description from their request
        2. Identify any mentioned deadline, priority level, or category
        3. Determine if additional information should be requested
        4. Format the task with all necessary details
        
        In your response, include:
        - Confirmation of the task being created
        - A summary of the task details you've captured
        - Any follow-up questions for missing but important information
        - A helpful suggestion for what they might want to do next
        """
        return system_prompt

    def get_update_tasks_system_prompt(self) -> str:
        """
        Get system prompt for updating tasks
        """
        system_prompt = """
        You are a task management assistant. The user is asking to update or modify an existing task.
        Help them make changes to their task effectively.
        Consider the following:
        1. Identify which task they want to update (by title, ID, or description)
        2. Determine what aspects they want to change (deadline, priority, description, status)
        3. Format the updated task information clearly
        4. Check if confirmation is needed before updating
        
        In your response, include:
        - Acknowledgment of which task is being updated
        - The specific changes being made
        - Confirmation of the update
        - A helpful suggestion for what they might want to do next
        """
        return system_prompt

    def get_delete_tasks_system_prompt(self) -> str:
        """
        Get system prompt for deleting tasks
        """
        system_prompt = """
        You are a task management assistant. The user is asking to delete or remove a task.
        Help them safely remove the task they specify.
        Consider the following:
        1. Identify which task they want to delete (by title, ID, or description)
        2. Confirm if this is a permanent deletion or if it should be archived
        3. Check if confirmation is needed before deleting
        4. Prepare for potential undo/restore requests
        
        In your response, include:
        - Clear identification of which task will be deleted
        - Confirmation that the task has been deleted
        - Information about how to restore the task if needed
        - A helpful suggestion for what they might want to do next
        """
        return system_prompt

    async def process_ai_response(self, ai_response: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """Process the AI's response for task-related operations"""
        try:
            # Validate AI response structure
            
            if not isinstance(ai_response, dict) or 'response' not in ai_response:
                return {
                    'success': False,
                    'message': 'Invalid AI response format'
                }
                
            # Extract fields from AI response
            response_obj = ai_response.get('response', {})
            action = response_obj.get('action')
            data = response_obj.get('data', {})
            message = response_obj.get('message', 'Task operation processed')
            context_updates = ai_response.get('context_updates', {})
            
            # Validate action
            if not action:
                return {
                    'success': False,
                    'message': 'No action specified in AI response'
                }
                            
            # Process the task action
            handler_result = await self._handle_task_action({
                'action': action,
                'data': data
            }, user_token)
            
            print("Handler result: ", handler_result)
            
            if not handler_result.get('success'):
                return handler_result
            
            # Return the successful result with additional context
            return {
                'success': True,
                'action': action,
                'data': handler_result.get('data', data),
                'message': handler_result.get('message', message),
                'context_updates': context_updates
            }
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'message': f"Error processing AI response: {str(e)}"
            }