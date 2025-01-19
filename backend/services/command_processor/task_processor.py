from typing import Dict, Any, Optional, List, TypedDict, Union
from datetime import datetime
from dateutil import parser
import pytz
from enum import Enum
from dataclasses import dataclass
from services.command_processor.base_processor import BaseCommandProcessor
from services.task_services import TaskService
from services.reminder_service import ReminderService

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
    reminder: Optional[Dict[str, Any]] = None

class TaskValidationError(Exception):
    """Custom exception for task validation errors"""
    pass

class TaskProcessor(BaseCommandProcessor):
    def __init__(self, db):
        super().__init__(db)
        self.task_service = TaskService(db)
        self.reminder_service = ReminderService(db)
        self.timezone = pytz.timezone('Asia/Kolkata')

    def get_system_prompt(self) -> str:
        return """You are a task management assistant. Help users manage their tasks and reminders effectively.
        You can create, list, update, and delete tasks. You can also set reminders for tasks.
        
        For tasks with reminders, make sure to:
        1. Parse and validate reminder times
        2. Handle recurring reminders appropriately
        3. Consider timezone (Asia/Kolkata) when setting reminders
        4. Support natural language time expressions (tomorrow, next week, etc.)
        
        Task Priorities: High, Medium, Low
        Task Statuses: Pending, In Progress, Completed
        Recurrence Types: daily, weekly, monthly, yearly
        
        Always validate input data and provide clear error messages."""

    async def process_message(self, message: str, context_prompt: str = "", conversation_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process user message with enhanced error handling"""
        try:
            parsed_result = await self._parse_natural_language(message)
            if not parsed_result['success']:
                return parsed_result
                
            ai_result = await super().process_message(message, context_prompt, conversation_context)
            if not ai_result.get('success'):
                return ai_result
                
            processed_result = await self.process_ai_response(ai_result)
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
        
        if not handler:
            return self._error_response(f"Unknown action: {action}", "invalid_action")
            
        try:
            return await handler(result.get('data', {}), user_token)
        except Exception as e:
            return self._error_response(f"Error in {action}: {str(e)}", "action_error")

    def _validate_task_data(self, data: Dict[str, Any]) -> TaskData:
        """Validate and convert task data"""
        if not data.get('title'):
            raise TaskValidationError("Task title is required")
            
        try:
            task_data = TaskData(
                title=data['title'],
                description=data.get('description'),
                priority=TaskPriority(data.get('priority', 'Medium')),
                status=TaskStatus(data.get('status', 'Pending'))
            )
            
            if data.get('dueDate'):
                task_data.due_date = parser.parse(data['dueDate'])
                
            if data.get('reminder'):
                self._validate_reminder_data(data['reminder'])
                task_data.reminder = data['reminder']
                
            return task_data
            
        except ValueError as e:
            raise TaskValidationError(f"Invalid task data: {str(e)}")

    def _validate_reminder_data(self, reminder: Dict[str, Any]) -> None:
        """Validate reminder data"""
        if not reminder.get('time'):
            raise TaskValidationError("Reminder time is required")
            
        try:
            if isinstance(reminder['time'], str):
                parser.parse(reminder['time'])
                
            if reminder.get('recurring'):
                recurring = reminder['recurring']
                if not isinstance(recurring, dict):
                    raise TaskValidationError("Recurring must be a dictionary")
                    
                if 'type' not in recurring:
                    raise TaskValidationError("Recurring type is required")
                    
                RecurrenceType(recurring['type'])
                
                if recurring.get('endDate'):
                    parser.parse(recurring['endDate'])
                    
        except ValueError as e:
            raise TaskValidationError(f"Invalid reminder data: {str(e)}")

    async def _create_task(self, data: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """Create task with validated data"""
        task_data = self._validate_task_data(data)
        task_dict = {
            'title': task_data.title,
            'description': task_data.description,
            'priority': task_data.priority.value,
            'status': task_data.status.value,
            'dueDate': task_data.due_date.isoformat() if task_data.due_date else None
        }
        
        task_result = await self.task_service.add_task(task_dict, user_token)
        
        if task_data.reminder:
            try:
                reminder = await self._add_reminder(task_result['id'], task_result['userId'], task_data.reminder)
                task_result['reminder'] = reminder
            except Exception as e:
                task_result['reminder_error'] = str(e)
        
        return self._success_response('create_task', task_result, "Task created successfully")

    async def _add_reminder(self, task_id: str, user_id: str, reminder_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add reminder with validation"""
        self._validate_reminder_data(reminder_data)
        
        reminder_time = parser.parse(reminder_data['time']) if isinstance(reminder_data['time'], str) else reminder_data['time']
        
        if reminder_time.tzinfo is None:
            reminder_time = self.timezone.localize(reminder_time)
            
        return self.reminder_service.add_task_reminder(
            task_id=task_id,
            user_id=user_id,
            reminder_time=reminder_time,
            recurring=reminder_data.get('recurring')
        )

    async def _list_tasks(self, data: Dict[str, Any], user_token: str) -> Dict[str, Any]:
        """List tasks with enhanced filtering"""
        tasks = await self.task_service.get_tasks(user_token)
        
        if data.get('filter'):
            tasks = self._apply_filters(tasks, data['filter'])
            
        if data.get('include_reminders'):
            tasks = await self._include_reminders(tasks)
            
        return self._success_response('list_tasks', tasks, f"Found {len(tasks)} tasks")

    def _apply_filters(self, tasks: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply filters with validation"""
        filtered_tasks = tasks
        
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
                due_date = parser.parse(filters['due_date']).date()
                filtered_tasks = [t for t in filtered_tasks if t.get('dueDate') and 
                                parser.parse(t['dueDate']).date() == due_date]
            except ValueError:
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

    async def process_ai_response(self, ai_response: Dict[str, Any]) -> Dict[str, Any]:
        """Process the AI's response for task-related operations"""
        try:
            # Validate AI response structure
            if not isinstance(ai_response, dict):
                return {
                    'success': False,
                    'message': 'Invalid AI response format'
                }
                
            # Extract action and data from AI response
            action = ai_response.get('action')
            data = ai_response.get('data', {})
            
            if not action:
                return {
                    'success': False,
                    'message': 'No action specified in AI response'
                }
                
            # Validate and process based on action type
            if action == 'create_task':
                if not data.get('title'):
                    return {
                        'success': False,
                        'message': 'Task title is required'
                    }
                    
            elif action == 'update_task':
                if not data.get('description') or not data.get('updates'):
                    return {
                        'success': False,
                        'message': 'Task description and updates are required'
                    }
                    
            elif action == 'delete_task':
                if not data.get('description'):
                    return {
                        'success': False,
                        'message': 'Task description is required for deletion'
                    }
                    
            # Return processed response
            return {
                'success': True,
                'action': action,
                'data': data,
                'message': ai_response.get('message', 'Task operation processed successfully')
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Error processing AI response: {str(e)}"
            }
