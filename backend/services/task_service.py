from datetime import datetime, timedelta
import pytz
from typing import Dict, Any, List, Optional
from .websocket_service import websocket_service

class TaskService:
    def __init__(self, db):
        self.db = db
        self.tasks_ref = db.collection('tasks')
        self.timezone = pytz.timezone('Asia/Kolkata')

    def _convert_to_datetime(self, timestamp) -> datetime:
        """Convert Firestore timestamp to datetime"""
        if isinstance(timestamp, dict) and 'seconds' in timestamp:
            return datetime.fromtimestamp(timestamp['seconds'], self.timezone)
        return timestamp

    def _calculate_next_reminder(self, reminder: Dict[str, Any]) -> Optional[datetime]:
        """Calculate the next reminder time based on recurring settings"""
        if not reminder or not reminder.get('recurring'):
            return None

        last_notification = self._convert_to_datetime(reminder.get('lastNotification'))
        if not last_notification:
            return self._convert_to_datetime(reminder['time'])

        recurring = reminder['recurring']
        interval = recurring.get('interval', 1)

        if recurring['frequency'] == 'daily':
            next_time = last_notification + timedelta(days=interval)
        elif recurring['frequency'] == 'weekly':
            next_time = last_notification + timedelta(weeks=interval)
        elif recurring['frequency'] == 'monthly':
            # Add months while handling month boundaries
            next_time = last_notification
            for _ in range(interval):
                month = next_time.month + 1
                year = next_time.year + (month > 12)
                month = (month - 1) % 12 + 1
                next_time = next_time.replace(year=year, month=month)
        else:
            return None

        # Check if we've passed the end date
        end_date = recurring.get('endDate')
        if end_date:
            end_date = self._convert_to_datetime(end_date)
            if next_time > end_date:
                return None

        return next_time

    async def check_reminders(self, user_id: str):
        """Check for due reminders and send notifications"""
        now = datetime.now(self.timezone)
        tasks = self.tasks_ref.where('status', '!=', 'Completed').stream()

        for task in tasks:
            task_data = task.to_dict()
            reminder = task_data.get('reminder')
            
            if not reminder:
                continue

            reminder_time = self._convert_to_datetime(reminder['time'])
            
            # Check if reminder is due
            if reminder_time and reminder_time <= now and not reminder.get('notificationSent'):
                # Send notification
                await websocket_service.send_notification(user_id, {
                    'id': task.id,
                    **task_data
                })

                # Update notification status
                self.tasks_ref.document(task.id).update({
                    'reminder.notificationSent': True,
                    'reminder.lastNotification': now
                })

                # Calculate and set next reminder if recurring
                next_reminder = self._calculate_next_reminder(reminder)
                if next_reminder:
                    self.tasks_ref.document(task.id).update({
                        'reminder.time': next_reminder,
                        'reminder.notificationSent': False
                    })

    async def add_reminder(self, task_id: str, reminder_data: Dict[str, Any], user_id: str):
        """Add or update a reminder for a task"""
        task_ref = self.tasks_ref.document(task_id)
        task = task_ref.get()
        
        if not task.exists:
            raise ValueError("Task not found")

        reminder = {
            'time': reminder_data['time'],
            'notificationSent': False
        }

        if 'recurring' in reminder_data:
            reminder['recurring'] = reminder_data['recurring']

        task_ref.update({'reminder': reminder})
        
        # Broadcast update
        await websocket_service.broadcast_task_update(
            user_id,
            {'id': task_id, **task.to_dict(), 'reminder': reminder},
            'update'
        )

    async def remove_reminder(self, task_id: str, user_id: str):
        """Remove a reminder from a task"""
        task_ref = self.tasks_ref.document(task_id)
        task = task_ref.get()
        
        if not task.exists:
            raise ValueError("Task not found")

        task_ref.update({
            'reminder': firestore.DELETE_FIELD
        })
        
        # Broadcast update
        task_data = task.to_dict()
        task_data.pop('reminder', None)
        await websocket_service.broadcast_task_update(
            user_id,
            {'id': task_id, **task_data},
            'update'
        )
